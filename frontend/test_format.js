// rent_type format 함수 테스트
const formatFunc = (val) => val === 'jeonse' ? '전세' : '월세';

console.log("rent_type: 'jeonse' =>", formatFunc('jeonse'));
console.log("rent_type: 'monthly' =>", formatFunc('monthly'));
console.log("rent_type: undefined =>", formatFunc(undefined));
console.log("rent_type: null =>", formatFunc(null));
