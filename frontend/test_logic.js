// 실제 렌더링 로직 시뮬레이션
const asset = {
  sub_category: '부동산',
  rent_type: 'jeonse',
  jeonse_deposit: 48000000,
  rental_income: null
};

const columns = [
  { key: 'area_pyeong', label: '면적(평)', format: function(val) { return val + '평'; } },
  { key: 'acquisition_tax', label: '취득세', format: function(val) { return '₩' + val.toLocaleString(); } },
  { key: 'rent_type', label: '임대형태', format: function(val) { return val === 'jeonse' ? '전세' : '월세'; } },
  { key: 'rental_income', label: '임대수익', format: function(val) { return '₩' + val.toLocaleString(); } },
  { key: 'jeonse_deposit', label: '전세보증금', format: function(val) { return '₩' + val.toLocaleString(); } }
];

console.log('=== 렌더링 시뮬레이션 ===');
columns.forEach(function(col) {
  const value = asset[col.key];
  let result;
  
  // 조건부 렌더링 로직
  if (asset.sub_category === '부동산') {
    if (col.key === 'jeonse_deposit' && asset.rent_type === 'monthly') {
      result = '-';
    } else if (col.key === 'rental_income' && asset.rent_type === 'jeonse') {
      result = '-';
    } else if (col.key === 'jeonse_deposit' && asset.rent_type === 'jeonse' && asset.jeonse_deposit) {
      result = col.format(asset.jeonse_deposit);
    } else {
      result = value !== null && value !== undefined ? col.format(value) : '-';
    }
  } else {
    result = value !== null && value !== undefined ? col.format(value) : '-';
  }
  
  console.log(col.label + ' (' + col.key + '): ' + result);
});
