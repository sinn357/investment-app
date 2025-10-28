// getSubCategoryColumns 함수 시뮬레이션
function getSubCategoryColumns(subCategory) {
  const subCat = subCategory?.toLowerCase();
  
  console.log(`입력: "${subCategory}" -> toLowerCase: "${subCat}"`);
  
  switch (subCat) {
    case '부동산':
      console.log('✅ 부동산 케이스 매칭!');
      return [
        { key: 'area_pyeong', label: '면적(평)' },
        { key: 'acquisition_tax', label: '취득세' },
        { key: 'rent_type', label: '임대형태' },
        { key: 'rental_income', label: '임대수익' },
        { key: 'jeonse_deposit', label: '전세보증금' }
      ];
    default:
      console.log('❌ 매칭 실패 - 빈 배열 반환');
      return [];
  }
}

// 테스트
console.log('\n=== 테스트 1: 정상 케이스 ===');
const result1 = getSubCategoryColumns('부동산');
console.log('반환 컬럼 수:', result1.length);

console.log('\n=== 테스트 2: null 케이스 ===');
const result2 = getSubCategoryColumns(null);
console.log('반환 컬럼 수:', result2.length);

console.log('\n=== 테스트 3: 다른 소분류 ===');
const result3 = getSubCategoryColumns('예금');
console.log('반환 컬럼 수:', result3.length);
