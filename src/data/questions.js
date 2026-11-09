const questions = [
  {
    name: '林芝市',
    level: 'city',
    adcode: '540400',
    coordinates: [94.937467, 29.612778],
    question: '世界最深的大峡谷，最深处达6009米，长度超过500公里。它藏在中国西藏东南部。请找到它所在的地级市。',
    knowledge: '这里是雅鲁藏布大峡谷。它全长约504.6公里，最深处达到6009米，是世界最深的大峡谷。峡谷从林芝一带向南延伸，穿过高山与深谷，巨大的落差造就了极为壮观的地形景观。',
    fact: '雅鲁藏布大峡谷位于西藏林芝市境内，核心景区在米林一带。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/%E9%9B%85%E9%B2%81%E8%97%8F%E5%B8%83%E5%A4%A7%E5%B3%A1%E8%B0%B7_-_panoramio.jpg',
    imageCredit: 'Photo: mayanming / Wikimedia Commons',
    imageLicense: 'https://creativecommons.org/licenses/by-sa/3.0/',
    imageLicenseName: 'CC BY-SA 3.0'
  },
  {
    name: '甘孜藏族自治州',
    level: 'city',
    adcode: '513300',
    coordinates: [100.053333, 29.323060],
    question: '有一座民用机场，海拔4411米，是世界上海拔最高的民用机场。飞机要在高原山地间起降。请找到它所属的自治州。',
    knowledge: '这里是稻城亚丁机场，位于四川省甘孜藏族自治州稻城县，机场标高4411米。高海拔和复杂的山地地形，让飞机起降面临特殊挑战，也使它成为世界上海拔最高的民用机场。',
    fact: '稻城亚丁机场于2013年通航，机场海拔约4411米。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/DCY_Airport.jpg',
    imageCredit: 'Photo: Frankmnl / Wikimedia Commons',
    imageLicense: 'https://creativecommons.org/licenses/by-sa/4.0/',
    imageLicenseName: 'CC BY-SA 4.0'
  },
  {
    name: '遵义市',
    level: 'city',
    adcode: '520300',
    coordinates: [107.305209, 28.238319],
    question: '地下藏着一套超级迷宫，124个洞口彼此连通，洞穴总长度竟然超过481公里！它是亚洲最长的洞穴系统。请找到它所在的地级行政区。',
    knowledge: '这里是贵州遵义绥阳的双河洞。2026年最新一轮科考公布，双河洞系统总长度达到481.5公里，共有124个洞口连通，位居亚洲第一长洞。洞穴仍在不断被探索，地下世界可能还会继续延伸。',
    fact: '双河洞位于贵州省遵义市绥阳县，是世界级的超大型洞穴系统。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Landscape_inside_Shuanghe_Cave.jpg',
    imageCredit: 'Photo: Eric Sanson; credit: Grottes et Karsts de Chine / Wikimedia Commons',
    imageLicense: 'https://creativecommons.org/licenses/by-sa/4.0/',
    imageLicenseName: 'CC BY-SA 4.0'
  },
  {
    name: '海北藏族自治州',
    level: 'city',
    adcode: '632200',
    coordinates: [100.906199, 36.956993],
    question: '1961年，一位世界知名的物理学家接受绝密任务，化名“王京”，从公众视野中消失了17年。他参与了中国核武器的研制工作。请找到当年中国第一个核武器研制基地所在的自治州。',
    knowledge: '这位科学家就是王淦昌。1961年，他接受参加中国核武器研制工作的任务后，化名“王京”，隐姓埋名17年。他工作的地方与青海金银滩的中国第一个核武器研制基地有关。如今，这片土地被称为原子城，留下了那段隐秘而重要的历史。',
    fact: '金银滩原子城位于青海省海北藏族自治州海晏县西海镇一带。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/%E5%B9%B4%E8%BD%BB%E6%97%B6%E7%9A%84%E7%8E%8B%E6%B7%A6%E6%98%8C.jpg',
    imageCredit: 'Photo: unknown author / Wikimedia Commons (source: The Paper)',
    imageLicense: 'https://commons.wikimedia.org/wiki/File:%E5%B9%B4%E8%BD%BB%E6%97%B6%E7%9A%84%E7%8E%8B%E6%B7%A6%E6%98%8C.jpg',
    imageLicenseName: 'Public domain in China'
  },
  {
    name: '阿拉善盟',
    level: 'city',
    adcode: '152900',
    coordinates: [100.313220, 41.306140],
    question: '1970年，中国第一颗人造卫星把《东方红》乐曲送入太空。它从“酒泉卫星发射中心”升空，但发射场其实不在甘肃酒泉，而在内蒙古。请找到发射场所在的盟。',
    knowledge: '1970年4月24日，中国第一颗人造地球卫星“东方红一号”成功发射，卫星上的乐音装置把《东方红》乐曲送入太空。发射中心虽然叫“酒泉卫星发射中心”，实际位于内蒙古自治区阿拉善盟额济纳旗。这道题的反转就在名字里：叫酒泉，却不在酒泉。',
    fact: '东方红一号从酒泉卫星发射中心发射，发射场位于内蒙古阿拉善盟额济纳旗。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jiuquan_Satellite_Launch_Center_main_launch_tower.JPG',
    imageCredit: 'Photo: AAxanderr / Wikimedia Commons',
    imageLicense: 'https://commons.wikimedia.org/wiki/File:Jiuquan_Satellite_Launch_Center_main_launch_tower.JPG',
    imageLicenseName: 'Public domain'
  }
]

export default questions
