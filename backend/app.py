from flask import Flask, jsonify, request, make_response, Response
from flask_cors import CORS
import os
import functools
from dotenv import load_dotenv
from crawlers.investing_crawler import get_ism_manufacturing_pmi, parse_history_table, fetch_html
from crawlers.ism_non_manufacturing import get_ism_non_manufacturing_pmi
from crawlers.sp_global_composite import get_sp_global_composite_pmi
from crawlers.industrial_production import get_industrial_production
from crawlers.industrial_production_1755 import get_industrial_production_1755
from crawlers.retail_sales import get_retail_sales_data
from crawlers.retail_sales_yoy import get_retail_sales_yoy_data
from crawlers.gdp import get_gdp_data
from crawlers.cb_consumer_confidence import get_cb_consumer_confidence_data
from crawlers.michigan_consumer_sentiment import get_michigan_consumer_sentiment_data
from crawlers.unemployment_rate import get_unemployment_rate
from crawlers.nonfarm_payrolls import get_nonfarm_payrolls
from services.database_service import DatabaseService
from services.crawler_service import CrawlerService
import threading
import time

# PostgreSQL 서비스 임포트 시도
try:
    from services.postgres_database_service import PostgresDatabaseService
    POSTGRES_AVAILABLE = True
except ImportError as e:
    print(f"PostgreSQL not available: {e}")
    POSTGRES_AVAILABLE = False

load_dotenv()

app = Flask(__name__)
CORS(app,
     origins=["https://investment-app-rust-one.vercel.app", "http://localhost:3000"],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# CORS preflight 핸들러 추가
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = Response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

# 데이터베이스 서비스 초기화 (PostgreSQL 우선 사용)
try:
    database_url = os.getenv('DATABASE_URL')
    if database_url and database_url.startswith('postgres') and POSTGRES_AVAILABLE:
        print("Using PostgreSQL database...")
        db_service = PostgresDatabaseService(database_url)
    else:
        print("Using SQLite database...")
        db_service = DatabaseService()
except Exception as e:
    print(f"PostgreSQL connection failed, falling back to SQLite: {e}")
    db_service = DatabaseService()

# JWT 토큰 검증 데코레이터
def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Authorization 헤더에서 토큰 추출
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # "Bearer <token>"
            except IndexError:
                return jsonify({'status': 'error', 'message': 'Invalid token format'}), 401

        if not token:
            return jsonify({'status': 'error', 'message': 'Token is missing'}), 401

        try:
            # JWT 토큰 검증
            current_user = db_service.verify_jwt_token(token)
            if current_user['status'] != 'success':
                return jsonify(current_user), 401
        except Exception as e:
            print(f"Token verification error: {e}")
            return jsonify({'status': 'error', 'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

# 보안 헤더 추가
@app.after_request
def after_request(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# 업데이트 상태 추적 (전역 변수)
update_status = {
    "is_updating": False,
    "progress": 0,
    "current_indicator": "",
    "completed_indicators": [],
    "failed_indicators": [],
    "start_time": None
}

# Import test
try:
    print("Testing retail sales import...")
    from crawlers.retail_sales import get_retail_sales_data
    print("Retail sales import successful")
except Exception as e:
    print(f"Retail sales import failed: {e}")
    import traceback
    traceback.print_exc()

@app.route('/')
def health_check():
    return jsonify({"status": "healthy", "service": "investment-app-backend"})

@app.route('/api/economic-indicators')
def get_economic_indicators():
    mock_data = [
        {
            "name": "한국은행 기준금리",
            "latestDate": "2025-09-15",
            "nextDate": "2025-10-15",
            "actual": 3.50,
            "forecast": 3.25,
            "previous": 3.25,
            "surprise": 0.25,
            "threshold": {"value": 4.0, "type": "warning"}
        },
        {
            "name": "소비자물가지수(CPI)",
            "latestDate": "2025-09-10",
            "nextDate": "2025-10-10",
            "actual": 2.8,
            "forecast": 2.5,
            "previous": 2.6,
            "surprise": 0.3,
            "threshold": {"value": 3.0, "type": "critical"}
        },
        {
            "name": "실업률",
            "latestDate": "2025-09-08",
            "nextDate": "2025-10-08",
            "actual": 3.2,
            "forecast": 3.1,
            "previous": 3.0,
            "surprise": 0.1,
            "threshold": None
        },
        {
            "name": "GDP 성장률",
            "latestDate": "2025-08-30",
            "nextDate": "2025-11-30",
            "actual": None,
            "forecast": 2.8,
            "previous": 2.6,
            "surprise": None,
            "threshold": None
        },
        {
            "name": "산업생산지수",
            "latestDate": "2025-09-12",
            "nextDate": "2025-10-12",
            "actual": 1.2,
            "forecast": 0.8,
            "previous": 0.5,
            "surprise": 0.4,
            "threshold": {"value": 2.0, "type": "warning"}
        }
    ]

    return jsonify({
        "status": "success",
        "data": mock_data,
        "timestamp": "2025-09-17T13:20:00Z"
    })

@app.route('/api/rawdata/latest')
def get_latest_rawdata():
    """Get latest economic data from investing.com crawling"""
    try:
        data = get_ism_manufacturing_pmi()

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "ISM Manufacturing PMI"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/history-table/<indicator>')
def get_history_table(indicator):
    """Get full history table data for specific indicator"""
    try:
        # Map indicator names to URLs
        indicator_urls = {
            'ism-manufacturing': 'https://www.investing.com/economic-calendar/ism-manufacturing-pmi-173',
            'ism-non-manufacturing': 'https://www.investing.com/economic-calendar/ism-non-manufacturing-pmi-176',
            'sp-global-composite': 'https://www.investing.com/economic-calendar/s-p-global-composite-pmi-1492',
            'industrial-production': 'https://www.investing.com/economic-calendar/industrial-production-161',
            'industrial-production-1755': 'https://www.investing.com/economic-calendar/industrial-production-1755'
        }

        if indicator not in indicator_urls:
            return jsonify({
                "status": "error",
                "message": f"Indicator '{indicator}' not supported"
            }), 404

        url = indicator_urls[indicator]

        # Fetch and parse history table
        html = fetch_html(url)
        rows = parse_history_table(html)

        return jsonify({
            "status": "success",
            "indicator": indicator,
            "data": rows,
            "source": "investing.com",
            "total_rows": len(rows)
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch history table: {str(e)}"
        }), 500

@app.route('/api/rawdata/ism-non-manufacturing')
def get_ism_non_manufacturing_rawdata():
    """Get ISM Non-Manufacturing PMI raw data"""
    try:
        data = get_ism_non_manufacturing_pmi()

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "ISM Non-Manufacturing PMI"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/rawdata/sp-global-composite')
def get_sp_global_composite_rawdata():
    """Get S&P Global Composite PMI raw data"""
    try:
        data = get_sp_global_composite_pmi()

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "S&P Global Composite PMI"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/rawdata/industrial-production')
def get_industrial_production_rawdata():
    """Get Industrial Production raw data"""
    try:
        data = get_industrial_production()

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "Industrial Production"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/rawdata/industrial-production-1755')
def get_industrial_production_1755_rawdata():
    """Get Industrial Production (1755) raw data"""
    try:
        data = get_industrial_production_1755()

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "Industrial Production YoY"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/rawdata/retail-sales')
def get_retail_sales_rawdata():
    try:
        data = get_retail_sales_data()

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "Retail Sales MoM"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/history-table/retail-sales')
def get_retail_sales_history():
    try:
        url = "https://www.investing.com/economic-calendar/retail-sales-256"
        html_content = fetch_html(url)
        if html_content:
            history_data = parse_history_table(html_content)
            if history_data:
                return jsonify({
                    "status": "success",
                    "data": history_data,
                    "indicator": "Retail Sales MoM",
                    "source": "investing.com"
                })
        return jsonify({"status": "error", "message": "Failed to fetch retail sales history data"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/rawdata/retail-sales-yoy')
def get_retail_sales_yoy_rawdata():
    try:
        data = get_retail_sales_yoy_data()

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500

        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "Retail Sales YoY"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/history-table/retail-sales-yoy')
def get_retail_sales_yoy_history():
    try:
        url = "https://www.investing.com/economic-calendar/retail-sales-1878"
        html_content = fetch_html(url)
        if html_content:
            history_data = parse_history_table(html_content)
            if history_data:
                return jsonify({
                    "status": "success",
                    "data": history_data,
                    "indicator": "Retail Sales YoY",
                    "source": "investing.com"
                })
        return jsonify({"status": "error", "message": "Failed to fetch retail sales YoY history data"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/rawdata/gdp')
def get_gdp_rawdata():
    try:
        data = get_gdp_data()
        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500
        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "GDP QoQ"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/history-table/gdp')
def get_gdp_history():
    try:
        url = "https://www.investing.com/economic-calendar/gdp-375"
        html_content = fetch_html(url)
        if html_content:
            history_data = parse_history_table(html_content)
            if history_data:
                return jsonify({
                    "status": "success",
                    "data": history_data,
                    "indicator": "GDP QoQ",
                    "source": "investing.com"
                })
        return jsonify({"status": "error", "message": "Failed to fetch GDP history data"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/rawdata/cb-consumer-confidence')
def get_cb_consumer_confidence_rawdata():
    try:
        data = get_cb_consumer_confidence_data()
        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500
        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "CB Consumer Confidence"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/history-table/cb-consumer-confidence')
def get_cb_consumer_confidence_history():
    try:
        url = "https://www.investing.com/economic-calendar/cb-consumer-confidence-48"
        html_content = fetch_html(url)
        if html_content:
            history_data = parse_history_table(html_content)
            if history_data:
                return jsonify({
                    "status": "success",
                    "data": history_data,
                    "indicator": "CB Consumer Confidence",
                    "source": "investing.com"
                })
        return jsonify({"status": "error", "message": "Failed to fetch CB Consumer Confidence history data"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/rawdata/michigan-consumer-sentiment')
def get_michigan_consumer_sentiment_rawdata():
    try:
        data = get_michigan_consumer_sentiment_data()
        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500
        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "Michigan Consumer Sentiment"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/history-table/michigan-consumer-sentiment')
def get_michigan_consumer_sentiment_history():
    try:
        url = "https://www.investing.com/economic-calendar/michigan-consumer-sentiment-320"
        html_content = fetch_html(url)
        if html_content:
            history_data = parse_history_table(html_content)
            if history_data:
                return jsonify({
                    "status": "success",
                    "data": history_data,
                    "indicator": "Michigan Consumer Sentiment",
                    "source": "investing.com"
                })
        return jsonify({"status": "error", "message": "Failed to fetch Michigan Consumer Sentiment history data"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ========== 고용지표 API 엔드포인트 ==========

@app.route('/api/rawdata/unemployment-rate')
def get_unemployment_rate_rawdata():
    """실업률 Raw Data API 엔드포인트"""
    try:
        data = get_unemployment_rate()
        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500
        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "Unemployment Rate"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/rawdata/nonfarm-payrolls')
def get_nonfarm_payrolls_rawdata():
    """비농업 고용 Raw Data API 엔드포인트"""
    try:
        data = get_nonfarm_payrolls()
        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 500
        return jsonify({
            "status": "success",
            "data": data,
            "source": "investing.com",
            "indicator": "Nonfarm Payrolls"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Internal server error: {str(e)}"
        }), 500

@app.route('/api/history-table/unemployment-rate')
def get_unemployment_rate_history():
    """실업률 History Table API 엔드포인트"""
    try:
        url = "https://www.investing.com/economic-calendar/unemployment-rate-300"
        html_content = fetch_html(url)
        if html_content:
            history_data = parse_history_table(html_content)
            if history_data:
                return jsonify({
                    "status": "success",
                    "data": history_data,
                    "indicator": "Unemployment Rate",
                    "source": "investing.com"
                })
        return jsonify({"status": "error", "message": "Failed to fetch Unemployment Rate history data"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/history-table/nonfarm-payrolls')
def get_nonfarm_payrolls_history():
    """비농업 고용 History Table API 엔드포인트"""
    try:
        url = "https://www.investing.com/economic-calendar/nonfarm-payrolls"
        html_content = fetch_html(url)
        if html_content:
            history_data = parse_history_table(html_content)
            if history_data:
                return jsonify({
                    "status": "success",
                    "data": history_data,
                    "indicator": "Nonfarm Payrolls",
                    "source": "investing.com"
                })
        return jsonify({"status": "error", "message": "Failed to fetch Nonfarm Payrolls history data"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ========== 새로운 데이터베이스 기반 API 엔드포인트 ==========

@app.route('/api/v2/indicators')
def get_all_indicators_from_db():
    """데이터베이스에서 모든 지표 데이터 조회 (빠른 로딩용)"""
    try:
        # CrawlerService에 정의된 모든 지표를 확인하고 데이터베이스에 저장된 것만 포함
        all_indicator_ids = list(CrawlerService.INDICATOR_URLS.keys())
        results = []

        for indicator_id in all_indicator_ids:
            data = db_service.get_indicator_data(indicator_id)
            if "error" not in data:
                results.append({
                    "indicator_id": indicator_id,
                    "name": CrawlerService.get_indicator_name(indicator_id),
                    "data": data
                })

        return jsonify({
            "status": "success",
            "indicators": results,
            "total_count": len(results),
            "source": "database"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Database query failed: {str(e)}"
        }), 500

@app.route('/api/v2/indicators/<indicator_id>')
def get_indicator_from_db(indicator_id):
    """데이터베이스에서 특정 지표 데이터 조회"""
    try:
        data = db_service.get_indicator_data(indicator_id)

        if "error" in data:
            return jsonify({
                "status": "error",
                "message": data["error"]
            }), 404

        return jsonify({
            "status": "success",
            "indicator": CrawlerService.get_indicator_name(indicator_id),
            "data": data,
            "source": "database"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Database query failed: {str(e)}"
        }), 500

@app.route('/api/v2/history/<indicator_id>')
def get_history_from_db(indicator_id):
    """데이터베이스에서 히스토리 데이터 조회"""
    try:
        history_data = db_service.get_history_data(indicator_id)

        return jsonify({
            "status": "success",
            "indicator": indicator_id,
            "data": history_data,
            "total_rows": len(history_data),
            "source": "database"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Database query failed: {str(e)}"
        }), 500

def update_all_indicators_background():
    """백그라운드에서 모든 지표 업데이트 실행"""
    global update_status

    try:
        update_status["is_updating"] = True
        update_status["start_time"] = time.time()
        update_status["progress"] = 0
        update_status["completed_indicators"] = []
        update_status["failed_indicators"] = []

        # CrawlerService에 정의된 모든 지표 사용 (신규 지표 포함)
        indicators = list(CrawlerService.INDICATOR_URLS.keys())
        total_indicators = len(indicators)

        for i, indicator_id in enumerate(indicators):
            update_status["current_indicator"] = indicator_id
            update_status["progress"] = int((i / total_indicators) * 100)

            try:
                # 크롤링 실행
                crawled_data = CrawlerService.crawl_indicator(indicator_id)

                if "error" in crawled_data:
                    update_status["failed_indicators"].append({
                        "indicator_id": indicator_id,
                        "error": crawled_data["error"]
                    })
                else:
                    # 데이터베이스에 저장
                    db_service.save_indicator_data(indicator_id, crawled_data)
                    update_status["completed_indicators"].append(indicator_id)

            except Exception as e:
                update_status["failed_indicators"].append({
                    "indicator_id": indicator_id,
                    "error": str(e)
                })

            # 크롤링 간격
            time.sleep(1)

        update_status["progress"] = 100
        update_status["current_indicator"] = ""

    except Exception as e:
        update_status["failed_indicators"].append({
            "indicator_id": "system",
            "error": f"Update process failed: {str(e)}"
        })
    finally:
        update_status["is_updating"] = False

@app.route('/api/v2/update-indicators', methods=['POST'])
def trigger_update_indicators():
    """모든 지표 업데이트 트리거 (백그라운드 실행)"""
    global update_status

    if update_status["is_updating"]:
        return jsonify({
            "status": "error",
            "message": "Update is already in progress"
        }), 409

    # 백그라운드 스레드로 업데이트 실행
    thread = threading.Thread(target=update_all_indicators_background)
    thread.daemon = True
    thread.start()

    return jsonify({
        "status": "success",
        "message": "Update started in background",
        "check_status_url": "/api/v2/update-status"
    })

@app.route('/api/v2/update-status')
def get_update_status():
    """업데이트 진행 상황 조회"""
    return jsonify({
        "status": "success",
        "update_status": update_status
    })

@app.route('/api/v2/crawl-info')
def get_all_crawl_info():
    """모든 지표의 크롤링 정보 조회"""
    try:
        indicators = db_service.get_all_indicators()
        crawl_info_list = []

        for indicator_id in indicators:
            crawl_info = db_service.get_crawl_info(indicator_id)
            if crawl_info:
                crawl_info_list.append(crawl_info)

        return jsonify({
            "status": "success",
            "crawl_info": crawl_info_list
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/v2/crawl/<indicator_id>', methods=['POST'])
def crawl_single_indicator(indicator_id):
    """단일 지표 크롤링 후 데이터베이스 저장"""
    try:
        # 크롤링 실행
        crawled_data = CrawlerService.crawl_indicator(indicator_id)

        if "error" in crawled_data:
            return jsonify({
                "status": "error",
                "message": crawled_data["error"]
            }), 400

        # 데이터베이스에 저장
        success = db_service.save_indicator_data(indicator_id, crawled_data)

        if success:
            return jsonify({
                "status": "success",
                "message": f"Successfully crawled and saved {indicator_id}",
                "data": crawled_data
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"Failed to save {indicator_id} to database"
            }), 500

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error crawling {indicator_id}: {str(e)}"
        }), 500

@app.route('/api/add-asset', methods=['POST'])
def add_asset():
    """포트폴리오 자산 추가 API"""
    try:
        # JSON 데이터 받기
        data = request.get_json()
        print(f"Received data: {data}")

        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        # 필수 필드 검증
        required_fields = ['assetType', 'name', 'date', 'user_id']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400

        # 데이터 변환 (프론트엔드 형식 → DB 형식)
        asset_data = {
            'user_id': data.get('user_id'),
            'asset_type': data.get('assetType'),
            'sub_category': data.get('subCategory'),
            'name': data.get('name'),
            'amount': data.get('amount'),
            'quantity': data.get('quantity'),
            'avg_price': data.get('avgPrice'),
            'eval_amount': data.get('evaluationAmount'),
            'date': data.get('date'),
            'note': data.get('note')
        }

        # 데이터베이스에 저장
        print(f"About to save asset_data: {asset_data}")
        print(f"db_service type: {type(db_service)}")
        print(f"db_service has save_asset: {hasattr(db_service, 'save_asset')}")

        result = db_service.save_asset(asset_data)
        print(f"Save result: {result}")

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in add_asset: {e}")
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500

@app.route('/api/test-db', methods=['GET'])
def test_db():
    """데이터베이스 연결 및 메서드 테스트"""
    try:
        print(f"Testing database connection...")
        print(f"Database service type: {type(db_service)}")
        print(f"Database service methods: {[m for m in dir(db_service) if not m.startswith('_')]}")

        return jsonify({
            "status": "success",
            "db_type": str(type(db_service)),
            "has_save_asset": hasattr(db_service, 'save_asset')
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    """사용자별 포트폴리오 데이터 조회 API"""
    try:
        # 쿼리 파라미터에서 user_id 가져오기
        user_id = request.args.get('user_id')

        if user_id:
            user_id = int(user_id)

        # PostgreSQL에서 사용자별 자산 데이터 조회
        result = db_service.get_all_assets(user_id)

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error getting portfolio: {e}")
        return jsonify({
            "status": "error",
            "message": f"포트폴리오 조회 실패: {str(e)}"
        }), 500

@app.route('/api/update-asset/<int:asset_id>', methods=['PUT'])
def update_asset(asset_id):
    """포트폴리오 자산 수정 API"""
    try:
        data = request.get_json()
        print(f"Attempting to update asset with ID: {asset_id}")
        print(f"Update data: {data}")

        # 필수 필드 검증
        required_fields = ['asset_type', 'name', 'date']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "status": "error",
                    "message": f"필수 필드가 누락되었습니다: {field}"
                }), 400

        # 데이터베이스에서 자산 업데이트
        result = db_service.update_asset(asset_id, data)

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error updating asset: {e}")
        return jsonify({
            "status": "error",
            "message": f"자산 수정 실패: {str(e)}"
        }), 500

@app.route('/api/delete-asset/<int:asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    """포트폴리오 자산 삭제 API"""
    try:
        print(f"Attempting to delete asset with ID: {asset_id}")

        # 쿼리 파라미터에서 user_id 가져오기
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "user_id is required"
            }), 400

        # 데이터베이스에서 자산 삭제 (user_id 검증 포함)
        result = db_service.delete_asset(asset_id, user_id)

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error deleting asset: {e}")
        return jsonify({
            "status": "error",
            "message": f"자산 삭제 실패: {str(e)}"
        }), 500

@app.route('/api/goal-settings', methods=['GET'])
def get_goal_settings():
    """목표 설정 조회 API"""
    try:
        user_id = request.args.get('user_id', 'default')
        result = db_service.get_goal_settings(user_id)

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error getting goal settings: {e}")
        return jsonify({
            "status": "error",
            "message": f"목표 설정 조회 실패: {str(e)}"
        }), 500

@app.route('/api/goal-settings', methods=['POST'])
def save_goal_settings():
    """목표 설정 저장 API"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default')
        total_goal = data.get('total_goal', 50000000)
        target_date = data.get('target_date', '2024-12-31')
        category_goals = data.get('category_goals', {})

        print(f"Saving goal settings: user_id={user_id}, total_goal={total_goal}, target_date={target_date}")

        result = db_service.save_goal_settings(user_id, total_goal, target_date, category_goals)

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error saving goal settings: {e}")
        return jsonify({
            "status": "error",
            "message": f"목표 설정 저장 실패: {str(e)}"
        }), 500

# === 사용자 인증 API ===

@app.route('/api/auth/register', methods=['POST'])
def register():
    """회원가입 API"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        # 입력 검증
        if not username or not password:
            return jsonify({
                "status": "error",
                "message": "사용자명과 비밀번호를 모두 입력해주세요."
            }), 400

        if len(username) < 3:
            return jsonify({
                "status": "error",
                "message": "사용자명은 3글자 이상이어야 합니다."
            }), 400

        if len(password) < 4:
            return jsonify({
                "status": "error",
                "message": "비밀번호는 4글자 이상이어야 합니다."
            }), 400

        result = db_service.create_user(username, password)

        if result.get('status') == 'success':
            # 회원가입 성공 시 JWT 토큰 생성
            user_id = result.get('user_id')
            username = result.get('username')

            if user_id and username:
                token = db_service.generate_jwt_token(user_id, username)
                result['token'] = token

            return jsonify(result), 201
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"Error registering user: {e}")
        return jsonify({
            "status": "error",
            "message": f"회원가입 실패: {str(e)}"
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """로그인 API"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')

        # 입력 검증
        if not username or not password:
            return jsonify({
                "status": "error",
                "message": "사용자명과 비밀번호를 모두 입력해주세요."
            }), 400

        result = db_service.authenticate_user(username, password)

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 401

    except Exception as e:
        print(f"Error logging in user: {e}")
        return jsonify({
            "status": "error",
            "message": f"로그인 실패: {str(e)}"
        }), 500

@app.route('/api/auth/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """사용자 정보 조회 API"""
    try:
        user = db_service.get_user_by_id(user_id)

        if user:
            return jsonify({
                "status": "success",
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "created_at": user['created_at'].isoformat() if user['created_at'] else None
                }
            })
        else:
            return jsonify({
                "status": "error",
                "message": "사용자를 찾을 수 없습니다."
            }), 404

    except Exception as e:
        print(f"Error getting user: {e}")
        return jsonify({
            "status": "error",
            "message": f"사용자 조회 실패: {str(e)}"
        }), 500

@app.route('/api/admin/delete-user/<username>', methods=['DELETE'])
def admin_delete_user(username):
    """관리자 전용: 사용자 계정 삭제 API"""
    try:
        # 관리자 권한 체크 (임시로 특정 패스워드로 확인)
        admin_password = request.headers.get('X-Admin-Password')
        if admin_password != 'admin-delete-2025':
            return jsonify({
                "status": "error",
                "message": "관리자 권한이 필요합니다."
            }), 403

        result = db_service.delete_user(username)

        if result.get('status') == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({
            "status": "error",
            "message": f"사용자 삭제 실패: {str(e)}"
        }), 500

@app.route('/api/auth/delete-account', methods=['DELETE'])
@token_required
def delete_own_account(current_user):
    """사용자 자신의 계정 삭제 API"""
    try:
        data = request.get_json()
        password = data.get('password', '')

        if not password:
            return jsonify({
                "status": "error",
                "message": "비밀번호를 입력해주세요."
            }), 400

        # 현재 사용자 정보 확인
        user = db_service.get_user_by_id(current_user['user_id'])
        if not user:
            return jsonify({
                "status": "error",
                "message": "사용자를 찾을 수 없습니다."
            }), 404

        # 비밀번호 확인
        if not db_service._verify_password(password, user['password_hash']):
            return jsonify({
                "status": "error",
                "message": "비밀번호가 일치하지 않습니다."
            }), 401

        # 계정 삭제
        result = db_service.delete_user(user['username'])

        if result.get('status') == 'success':
            return jsonify({
                "status": "success",
                "message": "계정이 성공적으로 삭제되었습니다. 모든 데이터가 영구 삭제됩니다."
            })
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error deleting own account: {e}")
        return jsonify({
            "status": "error",
            "message": f"계정 삭제 실패: {str(e)}"
        }), 500

@app.route('/api/auth/request-password-reset', methods=['POST'])
def request_password_reset():
    """비밀번호 재설정 요청 API"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()

        if not username:
            return jsonify({
                "status": "error",
                "message": "사용자명을 입력해주세요."
            }), 400

        result = db_service.create_password_reset_request(username)

        if result.get('status') == 'success':
            return jsonify({
                "status": "success",
                "message": result.get('message'),
                "reset_token": result.get('reset_token'),  # 실제 운영에서는 이메일로 전송
                "expires_in": result.get('expires_in')
            })
        else:
            return jsonify(result), 400

    except Exception as e:
        print(f"Error requesting password reset: {e}")
        return jsonify({
            "status": "error",
            "message": "비밀번호 재설정 요청 실패"
        }), 500

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """비밀번호 재설정 실행 API"""
    try:
        data = request.get_json()
        reset_token = data.get('reset_token', '')
        new_password = data.get('new_password', '')

        if not reset_token or not new_password:
            return jsonify({
                "status": "error",
                "message": "재설정 토큰과 새 비밀번호를 모두 입력해주세요."
            }), 400

        # 토큰 검증
        token_result = db_service.verify_reset_token(reset_token)
        if token_result.get('status') != 'success':
            return jsonify(token_result), 401

        # 비밀번호 업데이트
        user_id = token_result.get('user_id')
        update_result = db_service.update_user_password(user_id, new_password)

        if update_result.get('status') == 'success':
            return jsonify({
                "status": "success",
                "message": "비밀번호가 성공적으로 재설정되었습니다. 새 비밀번호로 로그인해주세요."
            })
        else:
            return jsonify(update_result), 400

    except Exception as e:
        print(f"Error resetting password: {e}")
        return jsonify({
            "status": "error",
            "message": "비밀번호 재설정 실패"
        }), 500

@app.route('/api/auth/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    """로그인된 사용자의 비밀번호 변경 API"""
    try:
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')

        if not current_password or not new_password:
            return jsonify({
                "status": "error",
                "message": "현재 비밀번호와 새 비밀번호를 모두 입력해주세요."
            }), 400

        # 현재 사용자 정보 확인
        user = db_service.get_user_by_id(current_user['user_id'])
        if not user:
            return jsonify({
                "status": "error",
                "message": "사용자를 찾을 수 없습니다."
            }), 404

        # 현재 비밀번호 확인
        if not db_service._verify_password(current_password, user['password_hash']):
            return jsonify({
                "status": "error",
                "message": "현재 비밀번호가 일치하지 않습니다."
            }), 401

        # 새 비밀번호로 업데이트
        update_result = db_service.update_user_password(current_user['user_id'], new_password)

        if update_result.get('status') == 'success':
            return jsonify({
                "status": "success",
                "message": "비밀번호가 성공적으로 변경되었습니다."
            })
        else:
            return jsonify(update_result), 400

    except Exception as e:
        print(f"Error changing password: {e}")
        print(f"Error type: {type(e)}")
        print(f"Current user data: {current_user}")
        return jsonify({
            "status": "error",
            "message": f"비밀번호 변경 실패: {str(e)}"
        }), 500

@app.route('/api/debug/user/<username>')
def debug_user_hash(username):
    """임시 디버그: 사용자 해시 정보 확인"""
    try:
        user = db_service.get_user_by_username(username)
        if user:
            hash_format = "unknown"
            if user['password_hash'].startswith('$2'):
                hash_format = "bcrypt"
            elif ':' in user['password_hash']:
                hash_format = "pbkdf2"

            return jsonify({
                "username": user['username'],
                "hash_format": hash_format,
                "hash_prefix": user['password_hash'][:30] + "...",
                "created_at": str(user.get('created_at'))
            })
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/debug/users')
def debug_all_users():
    """임시 디버그: 모든 사용자 목록 조회"""
    try:
        with db_service.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, username, created_at FROM users ORDER BY created_at DESC")
                users = cur.fetchall()

                user_list = []
                for user in users:
                    user_list.append({
                        "id": user['id'],
                        "username": user['username'],
                        "created_at": str(user['created_at'])
                    })

                return jsonify({
                    "total_users": len(user_list),
                    "users": user_list
                })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/debug/cleanup-users', methods=['POST'])
def cleanup_all_users():
    """임시 디버그: 모든 사용자 계정 삭제"""
    try:
        with db_service.get_connection() as conn:
            with conn.cursor() as cur:
                # 모든 사용자 삭제 (CASCADE로 관련 데이터도 삭제)
                cur.execute("DELETE FROM users")
                deleted_count = cur.rowcount

                return jsonify({
                    "status": "success",
                    "message": f"{deleted_count}개의 사용자 계정이 삭제되었습니다.",
                    "deleted_count": deleted_count
                })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)