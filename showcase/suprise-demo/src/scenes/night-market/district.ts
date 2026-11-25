/** Metres, Y up. Six individually dressed blocks, with a continuous street network. */
export const districtBounds={minX:-72,maxX:72,minZ:-63,maxZ:63,maxY:65};
export const streetX=[-62,-20,20,62];
export const streetZ=[-50,0,50];
export const districtNames=['西埕老街','青草巷','牌樓街','南光商圈','民生街','東門食集'];
export const shopNames=[
  '永和豆漿','金禾麵包坊','安康西藥房','建成五金行','花樣布莊','電玩基地','翻頁二手書','光華理髮廳','青田水果行','泡泡洗衣房',
  '百草堂','黑膠年代','海港水族','榕安旅社','足下鞋店','金源雜貨','永興機車行','老湯牛肉麵','中山照相館','陳記鐘錶',
  '佳音音響','小熊玩具屋','文昌文具行','海棠花坊','宏昌電器','尚美美容院','巧手修改衣服','健行自行車','春雨茶莊','順發鎖印',
  '福氣寵物用品','城南文印社','銀河漫畫','阿美皮件','四季寢具','月光咖啡室','青松公寓','長春華廈','松庭名廈','里民活動中心',
  '榕景大樓','永和新村','林家古厝','環市十二號','春曉公寓','南街陳宅','社區書屋','晴川華廈','新榕居','環市三十八號',
  '西門吳宅','竹庭住宅','民生九號','望月名廈','春和公寓','東榕六號','紅葉公寓','德記洋樓',
];
export type BuildingSpec={id:number;block:number;x:number;z:number;angle:number;width:number;depth:number;floors:number;facade:number;windows:number;roof:number;name:string};
export const buildings:BuildingSpec[]=[];
for(let row=0;row<2;row++)for(let col=0;col<3;col++){
  const block=row*3+col,cx=[-41,0,41][col],cz=row?25:-25;
  const slots=[
    ...[-10.2,0,10.2].map(x=>({x:cx+x,z:cz-16,angle:Math.PI,width:10.05})),
    ...[-10.2,0,10.2].map(x=>({x:cx+x,z:cz+16,angle:0,width:10.05})),
    ...[-5.6,5.6].map(z=>({x:cx-11.1,z:cz+z,angle:-Math.PI/2,width:11.05})),
    ...[-5.6,5.6].map(z=>({x:cx+11.1,z:cz+z,angle:Math.PI/2,width:11.05})),
  ];
  slots.forEach((slot,index)=>{
    // Two small courtyards interrupt the perimeter and open the blocks to pedestrians.
    if((block===0||block===4)&&index===1)return;
    const id=buildings.length;
    buildings.push({id,block,...slot,depth:7.4,floors:[3,2,6,4,3,2,5,4,3,5,2,7,4,3,6,2,3,5,4,8,3,2,5,4,6,3,2,4,5,3,6,2,4,3,5,3,7,4,9,3,8,4,2,5,4,3,2,8,5,4,2,5,4,9,5,3,6,3][id],facade:id%9,windows:(id*3)%7,roof:(id*5)%8,name:shopNames[id]});
  });
}
export const vendorTypes=[
  ['胡椒餅','oven'],['藥燉排骨','soup'],['古早味豆花','tofu'],['蚵仔煎','griddle'],['珍珠奶茶','drinks'],['香酥雞排','fried'],
  ['手工水餃','dumplings'],['大腸麵線','soup'],['阿婆滷味','braised'],['青草茶','tea'],['炭烤香腸','grill'],['鮮榨果汁','fruit'],
  ['涼麵專賣','noodles'],['米糕四神湯','steamer'],['紅豆餅','pastry'],['地瓜球','fried'],['黑糖粉圓','tofu'],['鮮蚵湯','seafood'],
  ['手工麻糬','pastry'],['芋圓剉冰','ice'],['章魚燒','takoyaki'],['炭烤玉米','corn'],['鐵板牛排','griddle'],['烤地瓜','oven'],
  ['現切水果','fruit'],['蜂蜜檸檬','drinks'],['蔥油餅','griddle'],['蒸籠包子','steamer'],['臭豆腐','tofu'],['串燒專門','grill'],
  ['糖葫蘆','candy'],['日常襪舖','clothes'],['巷口花店','flowers'],['手機配件','accessories'],['古早味彈珠','games'],['手作皮件','bags'],
] as const;
export type VendorFamily=typeof vendorTypes[number][1];
export const districtStats={width:144,depth:126,blocks:6,buildings:buildings.length,stalls:buildings.length*2,vendorTypes:vendorTypes.length,vendingMachines:20,scooters:58,people:0};
export function toWorld(spec:Pick<BuildingSpec,'x'|'z'|'angle'>,x:number,z:number){return {x:spec.x+Math.cos(spec.angle)*x+Math.sin(spec.angle)*z,z:spec.z-Math.sin(spec.angle)*x+Math.cos(spec.angle)*z};}
