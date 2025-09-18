from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from crawlers.investing_crawler import get_ism_manufacturing_pmi, parse_history_table, fetch_html
from crawlers.ism_non_manufacturing import get_ism_non_manufacturing_pmi
from crawlers.sp_global_composite import get_sp_global_composite_pmi
from crawlers.industrial_production import get_industrial_production
from crawlers.industrial_production_1755 import get_industrial_production_1755
from crawlers.retail_sales import get_retail_sales_data
from crawlers.retail_sales_yoy import get_retail_sales_yoy_data
from crawlers.gdp import get_gdp_data
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
CORS(app, origins=["https://investment-app-rust-one.vercel.app", "http://localhost:3000"])

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

# ========== 새로운 데이터베이스 기반 API 엔드포인트 ==========

@app.route('/api/v2/indicators')
def get_all_indicators_from_db():
    """데이터베이스에서 모든 지표 데이터 조회 (빠른 로딩용)"""
    try:
        indicators = db_service.get_all_indicators()
        results = []

        for indicator_id in indicators:
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

        indicators = db_service.get_all_indicators()
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)