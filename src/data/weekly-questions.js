import questions from './questions.js'

// 周二每日挑战：2026-11-10
const tuesdayQuestions = [
  {
    name: '黔南布依族苗族自治州',
    level: 'city',
    adcode: '522700',
    coordinates: [106.856, 25.653],
    topic: '中国天眼',
    question: '贵州深山里，藏着一只直径500米的巨大「眼睛」。它能捕捉来自遥远宇宙的微弱信号，是世界上最大的单口径射电望远镜。请找到它所在的自治州。',
    knowledge: '这就是中国天眼 FAST，位于贵州平塘县大窝凼的天然洼地中。500米口径的巨型反射面，借助喀斯特地形建在群山之间。这个项目由天文学家南仁东推动，从构想到选址、建设，前后历时22年，2016年落成。如今，它持续接收来自宇宙深处的微弱射电信号，帮助科学家寻找脉冲星等天体。',
    fact: 'FAST位于贵州省黔南布依族苗族自治州平塘县，口径500米，2016年落成。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Five-hundred-meter_Aperture_Spherical_radio_Telescope_%28FAST%29%2C_Pingtang_County%2C_Guizhou%2C_China_-_October_1st%2C_2019_%2848835973221%29.jpg',
    imageCredit: 'Photo: Pierre Markuse / Wikimedia Commons',
    imageLicense: 'https://creativecommons.org/licenses/by/2.0/',
    imageLicenseName: 'CC BY 2.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Five-hundred-meter_Aperture_Spherical_radio_Telescope_(FAST),_Pingtang_County,_Guizhou,_China_-_October_1st,_2019_(48835973221).jpg'
  },
  {
    name: '张家界市',
    level: 'city',
    adcode: '430800',
    coordinates: [110.489572, 29.382847],
    topic: '张家界峰林',
    question: '这里有成千上万根直插云霄的石柱，像一片从地面生长出来的石头森林。1982年，中国第一个国家森林公园在这里建立。请找到这座城市。',
    knowledge: '这里是张家界国家森林公园。石英砂岩经过长期流水侵蚀、风化和崩塌，形成了一根根高耸的峰柱。1982年，张家界国家森林公园成立，成为中国第一个国家森林公园。这里独特的峰林景观，也为电影《阿凡达》中的悬浮山提供了视觉灵感。',
    fact: '张家界国家森林公园位于湖南省张家界市武陵源区。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sandstone_spire_forest_Zhangjiajie_Hunan.jpg',
    imageCredit: 'Photo: Lianguanlun / Wikimedia Commons',
    imageLicense: 'https://creativecommons.org/licenses/by/4.0/',
    imageLicenseName: 'CC BY 4.0',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Sandstone_spire_forest_Zhangjiajie_Hunan.jpg'
  },
  {
    name: '巴音郭楞蒙古自治州',
    level: 'city',
    adcode: '652800',
    coordinates: [91.76, 40.2833],
    coordinatesNote: '近似参考点：按库木库都克附近、失踪地点在营地以西约4—8公里的史料描述估算；不是经纬度已精确确认的失踪点。',
    topic: '彭加木失踪之谜',
    question: '1980年，一支科学考察队深入罗布泊进行考察。途中，队伍的饮用水几乎耗尽，科学家彭加木决定独自外出寻找水源，只留下一张纸条：「我往东去找水井。」从此，他消失在茫茫沙漠中，再也没有回来。请找到这片沙漠所在的自治州。',
    knowledge: '彭加木带队进入罗布泊，是为了完成综合科学考察，调查当地环境并寻找钾盐等资源。6月中旬，车队在沙地中艰难行进，原定两天的路程走了六天，水和汽油几乎耗尽。地图上标着附近有水井，他又听说东北方向的八一泉曾有水，便想先找水补给，也为后续考察做准备。6月17日，他留下纸条后失踪。国家组织了四次大规模搜寻，仍未找到他的遗体；脚印在盐壳地附近中断，风沙掩埋等说法都只是推测，失踪原因至今没有定论。',
    fact: '彭加木于1980年6月17日在罗布泊东南部库木库都克附近失踪；遗体至今没有被确认找到。',
    image: 'https://xjb.cas.cn/gbxwdt/gbzhxf/202305/W020230523744689931140.jpg',
    imageSecondary: 'https://xjb.cas.cn/gbxwdt/gbzhxf/202305/W020230523744691499730.jpg',
    imageLayout: 'side-by-side',
    imageCredit: '中国科学院新疆分院：彭加木照片；彭加木最后留下的字条',
    imageLicense: 'https://xjb.cas.cn/gbxwdt/gbzhxf/202305/t20230523_6761629.html',
    imageLicenseName: '页面未标注开放许可；正式公开使用前需向中国科学院新疆分院确认授权',
    imageSource: 'https://xjb.cas.cn/gbxwdt/gbzhxf/202305/t20230523_6761629.html',
    imageSecondaryCredit: '中国科学院新疆分院：彭加木最后留下的字条'
  },
  {
    name: '扬州市',
    level: 'city',
    adcode: '321000',
    coordinates: [119.40833, 32.42167],
    topic: '鉴真六次东渡',
    question: '一位中国高僧，六次尝试渡海去日本，前五次全部失败。途中他甚至双目失明，却依然没有放弃。请找到他当年准备东渡的城市。',
    knowledge: '他就是鉴真和尚。742年，日本僧人荣叡、普照来到扬州大明寺，邀请他东渡日本传授佛教戒律。此后十多年，鉴真先后五次渡海失败，经历风暴、阻拦和长途奔波，途中双目失明。753年，已经66岁的鉴真终于第六次东渡成功抵达日本，后来在奈良创建唐招提寺。',
    fact: '鉴真从扬州大明寺启程东渡；753年第六次东渡成功抵达日本。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ganjin_Toshodai-ji.jpg',
    imageCredit: 'Photo: 文化財協会 / Wikimedia Commons',
    imageLicense: 'https://commons.wikimedia.org/wiki/File:Ganjin_Toshodai-ji.jpg',
    imageLicenseName: 'Public domain in Japan and the United States (PD-Japan-oldphoto)',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Ganjin_Toshodai-ji.jpg'
  },
  {
    name: '东莞市',
    level: 'city',
    adcode: '441900',
    coordinates: [113.67, 22.82],
    topic: '虎门销烟',
    question: '1839年，一位钦差大臣下令公开销毁近两万箱鸦片，整个行动持续了23天。这场震动世界的行动，发生在今天的哪个地级市？',
    knowledge: '这位钦差大臣就是林则徐。1839年，他在广东查禁鸦片，要求外商交出鸦片，最终收缴了近两万箱。6月3日，虎门销烟正式开始：鸦片先用盐水浸泡，再加入石灰分解，最后引海水冲走。整个行动持续到6月25日，共23天。今天的虎门，属于广东省东莞市。',
    fact: '虎门销烟发生在今天广东省东莞市虎门镇。',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Destruction_of_opium_in_1839.jpg',
    imageCredit: 'Chinese artist / Wikimedia Commons',
    imageLicense: 'https://creativecommons.org/publicdomain/mark/1.0/',
    imageLicenseName: 'Public Domain Mark (PD-Art)',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Destruction_of_opium_in_1839.jpg'
  }
]

const weeklyQuestions = {
  monday: questions,
  tuesday: tuesdayQuestions,
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
}

export function getDailyQuestions() {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long'
  }).format(new Date()).toLowerCase()

  return weeklyQuestions[day]?.length
    ? weeklyQuestions[day]
    : questions
}

export default weeklyQuestions
