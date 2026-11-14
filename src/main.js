import './style.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import provinceData from './data/china_province_full.geojson?url'
import cityData from './data/china_city.geojson?url'
import * as turf from '@turf/turf'
import {
  initializeCloudPlayer,
  getTodayChallenge,
  startTodayChallenge,
  submitTodayAnswer,
  getTodayLeaderboard,
  getTodayStats
} from './services/game-api.js'

setWorkerUrl(workerUrl)

// 题目和玩家身份由 Supabase 提供；正式答案不会在初始页面下发。
let cloudSession = null
let cloudChallenge = null
let questions = []

try {
  await initializeCloudPlayer()
  cloudChallenge = await getTodayChallenge()
  cloudSession = await startTodayChallenge()

  questions = (cloudChallenge.questions || []).map(item => ({
    question: item.question_text,
    questionNumber: item.question_number,
    level: item.level,
    topic: item.topic || '',
    maxScore: item.max_score
  }))

  if (questions.length !== 5) {
    throw new Error('今日题库不是完整的五道题')
  }

  const restored = cloudSession.completed_questions || []
  for (const item of restored) {
    const index = Number(item.answer?.question_number) - 1
    if (index >= 0 && index < 5 && item.reveal) {
      applyCloudReveal(questions[index], item.reveal)
    }
  }
} catch (error) {
  console.error('[Cloud Challenge] 初始化失败：', error)
  const app = document.querySelector('#app')
  if (app) {
    app.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#050914;color:#fff;font-family:system-ui,sans-serif;">
        <div style="max-width:420px;text-align:center;">
          <h2 style="margin:0 0 12px;">今日挑战暂时无法加载</h2>
          <p style="line-height:1.7;color:#cbd5e1;">${String(error.message || '网络连接失败')}</p>
          <button onclick="location.reload()" style="margin-top:12px;padding:12px 22px;border:0;border-radius:10px;background:#2563eb;color:#fff;">重新加载</button>
        </div>
      </div>`
  }
  throw error
}

function applyCloudReveal(question, reveal) {
  question.name = reveal.answer_name || ''
  question.coordinates = reveal.answer_coordinates || null
  question.adcode = reveal.answer_adcode ?? reveal.adcode ?? question.adcode ?? null
  question.answerGeometry = reveal.answer_geometry || null

  const geometryType = reveal.answer_geometry_type ||
    (reveal.answer_geometry?.type === 'Feature'
      ? reveal.answer_geometry.geometry?.type
      : reveal.answer_geometry?.type)

  // 几何数据可能因 payload 优化而不再随答案传输，必须使用服务端返回的类型。
  question.type = geometryType === 'Point' ? 'mountain' : 'region'
  question.topic = reveal.topic || question.topic || question.name
  question.knowledge = reveal.knowledge || ''
  question.fact = reveal.fact || ''
  question.images = Array.isArray(reveal.images) ? reveal.images : []

  const image = question.images[0] || {}
  question.image = image.url || image.src || image.image_url || ''
  question.imageCredit = image.credit || image.author || image.source || '图片来源'
  question.imageLicense = image.license_url || image.url || '#'
  question.imageLicenseName = image.license_name || image.license || '图片授权信息'
}

const token = import.meta.env.VITE_GEOVIS_TOKEN
const tiandituKey = import.meta.env.VITE_TIANDITU_KEY
console.log('Token 是否加载：', !!token)

console.log('Token 是否读取成功：', Boolean(token))

document.querySelector('#app').innerHTML = `
<div id="game-header">
 <div id="progress">第 1 / 5 题</div>
<div id="coordinates">${questions[0]?.question ?? "准备开始挑战"}</div>
  <div id="score-display">
    <span id="score-value">0</span>
    <span class="score-unit">分</span>
  </div>

</div>
<button id="how-to-play" type="button">游戏规则</button>
  <div id="map"></div>
  <button id="confirm">确认位置</button>
  <button id="next-question" style="display:none;">下一题</button>
<div id="location-info" style="display:none;">
  <div class="location-info-kicker">
    <svg class="location-info-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5.2-8 12-8 12S4 15.2 4 10a8 8 0 1 1 16 0Z" fill="currentColor"/>
      <circle cx="12" cy="10" r="2.7" fill="#062033"/>
    </svg>
    <span class="location-info-label">LOCATION FILE</span>
    <span class="location-info-rule" aria-hidden="true"></span>
    <span class="location-info-unlocked"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9"/></svg>已解锁</span>
  </div>
  <div class="location-info-title" id="location-info-title"></div>
  <div id="location-info-content"></div>
  <button id="location-info-toggle"
        type="button"
        aria-expanded="false">
  展开全文⌄
</button>
</div>
  <div id="results-screen" style="display:none;">
  <main id="results-content">

    <section id="results-summary">
      <div class="results-heading">今日挑战成绩</div>

      <div id="final-score">0</div>
      <div class="results-subtitle">最终得分 · 满分 1000 分</div>

      <div id="results-dots"></div>

      <div id="results-bars"></div>

      <div class="results-actions">
        <button id="share-score">分享成绩</button>
        <button id="track-stats">查看统计</button>
      </div>
      <div class="results-actions">
  <button id="back-to-game">返回游戏首页</button>
</div>

      <div id="share-feedback"></div>
    </section>
        <section id="more-challenges">
      <div class="more-challenges-title">
        还想再挑战一轮？
      </div>

      <button id="more-challenges-button">
        探索更多挑战
      </button>

      <div id="more-challenges-feedback">
        更多地理挑战，敬请期待
      </div>
    </section>
    <section id="distance-section">
  <div class="distance-heading">你的定位表现</div>
  <div class="distance-subtitle">
    五次点击距离正确答案的距离分布
  </div>

  <div id="distance-chart"></div>

  <div id="distance-summary"></div>
</section>
<section id="daily-stats">
  <div class="daily-stats-heading">今日数据</div>
  <div class="daily-stats-subtitle">今天所有玩家的挑战表现</div>

  <div class="daily-stats-grid">

    <div class="daily-stat-card">
      <div class="daily-stat-label">今日平均分</div>
      <div class="daily-stat-value" id="today-average-score">—</div>
      <div class="daily-stat-note">完成挑战玩家</div>
    </div>

    <div class="daily-stat-card">
      <div class="daily-stat-label">今日参与人数</div>
      <div class="daily-stat-value" id="today-participant-count">—</div>
      <div class="daily-stat-note">已完成五道题</div>
    </div>

    <div class="daily-stat-card">
      <div class="daily-stat-label">今日最容易题</div>
      <div class="daily-stat-value" id="today-easiest-question">—</div>
      <div class="daily-stat-note">按平均得分率</div>
    </div>

    <div class="daily-stat-card">
      <div class="daily-stat-label">今日最难题</div>
      <div class="daily-stat-value" id="today-hardest-question">—</div>
      <div class="daily-stat-note">按平均得分率</div>
    </div>

  </div>
  <div id="today-leaderboard-status" style="margin:18px 0 10px;color:#94a3b8;font-size:13px;">点击「查看统计」加载今日排行榜</div>
  <div id="today-leaderboard" style="display:grid;gap:8px;"></div>
</section>
<section id="detailed-results">
  <div class="detailed-heading">详细答题结果</div>
  <div class="detailed-subtitle">
    回顾今天的五道挑战，看看你离正确答案有多远
  </div>

  <div id="detailed-results-list"></div>
</section>

  </main>
</div>
<div id="rules-modal" class="rules-modal" aria-hidden="true">
  <div class="rules-backdrop" data-close-rules></div>
  <section class="rules-dialog" role="dialog" aria-modal="true" aria-labelledby="rules-title">
    <button id="close-rules" class="rules-close" type="button" aria-label="关闭">×</button>
    <div class="rules-eyebrow">CHINA GEO CHALLENGE</div>
    <h2 id="rules-title">游戏规则</h2>
    <p class="rules-intro">每天挑战 5 道中国地理题，看看你能拿多少分。</p>
    <ol class="rules-list">
      <li>阅读题目，判断目标地点。</li>
      <li>在中国地图上点击你认为正确的位置。</li>
      <li>系统根据你与正确地点的距离计算得分，越接近，得分越高。</li>
      <li>完成 5 道题，获得今日总成绩。</li>
    </ol>
    <div class="rules-facts">
      <div><span>每日更新</span><strong>北京时间 08:00</strong></div>
      <div><span>每日题量</span><strong>5 道</strong></div>
      <div><span>今日满分</span><strong>1000 分</strong></div>
    </div>
    <button id="rules-start" class="rules-start" type="button">开始挑战</button>
  </section>
</div>`

// 游戏规则：首次进入自动显示，之后可随时点击右上角查看
const rulesModal = document.querySelector('#rules-modal')
const openRules = () => {
  rulesModal.classList.add('is-open')
  rulesModal.setAttribute('aria-hidden', 'false')
}
const closeRules = () => {
  rulesModal.classList.remove('is-open')
  rulesModal.setAttribute('aria-hidden', 'true')
  try {
    localStorage.setItem('chinaGeoRulesSeen', '1')
  } catch (error) {
    // 浏览器禁用本地存储时，不影响游戏使用
  }
}

document.querySelector('#how-to-play').addEventListener('click', openRules)
// 手机端答案正文展开/收起
const locationInfo = document.querySelector('#location-info')
const locationInfoToggle = document.querySelector('#location-info-toggle')

locationInfoToggle.addEventListener('click', () => {
  const expanded = locationInfo.classList.toggle('is-expanded')

  locationInfoToggle.textContent = expanded ? '收起正文⌃' : '展开全文⌄'
  locationInfoToggle.setAttribute('aria-expanded', String(expanded))
})
document.querySelector('#close-rules').addEventListener('click', closeRules)
document.querySelector('#rules-start').addEventListener('click', closeRules)
rulesModal.querySelector('[data-close-rules]').addEventListener('click', closeRules)
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && rulesModal.classList.contains('is-open')) {
    closeRules()
  }
})

try {
  if (!localStorage.getItem('chinaGeoRulesSeen')) {
    openRules()
  }
} catch (error) {
  openRules()
}

const map = new Map({
  container: 'map',

  style: {
    version: 8,
    sources: {
      tianditu: {
        type: 'raster',
        tiles: [
          'https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' + tiandituKey
        ],
        tileSize: 256,
        attribution: '© 天地图'
      },
    
      province: {
        type: 'geojson',
        data: provinceData
      }
    },
    layers: [
      {
        id: 'satellite',
        type: 'raster',
        source: 'tianditu'
      },
      {
        id: 'province-boundaries',
        type: 'line',
        source: 'province',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.7,
          'line-opacity': 0.7
        }
      }
    ]
  },
  projection: {
    type: 'mercator'
  },
  renderWorldCopies: false,
  center: [104, 35],
  zoom: 2,
  minZoom: 2,
  maxZoom: 10,
  maxBounds: [
    [55, 0],
    [145, 60]
  ]
})

// 省级和地级市数据在后台并行加载；只有揭晓区域答案时才等待它们。
let provinceGeoJSON = null
let cityGeoJSON = null

const provinceGeoJSONPromise = fetch(provinceData)
  .then(response => {
    if (!response.ok) throw new Error(`省级区划加载失败：HTTP ${response.status}`)
    return response.json()
  })
  .then(data => {
    provinceGeoJSON = data
    console.log('省级区域加载完成：', provinceGeoJSON.features?.length || 0)
    return true
  })
  .catch(error => {
    console.error('省级行政区划数据加载失败：', error)
    return false
  })

const cityGeoJSONPromise = fetch(cityData)
  .then(response => {
    if (!response.ok) throw new Error(`地级市区划加载失败：HTTP ${response.status}`)
    return response.json()
  })
  .then(data => {
    cityGeoJSON = data
    console.log('地级市区域加载完成：', cityGeoJSON.features?.length || 0)
    return true
  })
  .catch(error => {
    console.error('地级市行政区划数据加载失败：', error)
    return false
  })
// 根据题目找到对应的行政区
function getAnswerFeature(question) {
  if (question.answerGeometry) {
    return question.answerGeometry.type === 'Feature'
      ? question.answerGeometry
      : {
          type: 'Feature',
          properties: {},
          geometry: question.answerGeometry
        }
  }

  const source = question.level === 'province'
    ? provinceGeoJSON
    : cityGeoJSON

  if (!source || !question.adcode) return null

  return source.features.find(feature =>
    String(feature.properties.adcode) === String(question.adcode)
  )
}

map.on('style.load', () => {
  map.setProjection({ type: 'globe' })
})
map.setPadding({
  top: 180,
  bottom: 0,
  left: 0,
  right: 0
})
map.addControl(
  new NavigationControl(),
  'top-right'
)
// 计算玩家点击位置到正确行政区的距离
// 计算玩家点击位置到正确行政区的距离

function calculateRegionDistance(point, question) {
  const clickedPoint = turf.point(point)

  // 山峰：计算点击位置到山峰坐标的距离
  if (question.type === 'mountain') {
    return turf.distance(
      clickedPoint,
      turf.point(question.coordinates),
      { units: 'kilometers' }
    )
  }

  // 湖泊、海岛：使用真实地理边界
  let feature = null

  if (question.type === 'lake' || question.type === 'island') {
    feature = question.feature
  } else {
    feature = getAnswerFeature(question)
  }

  if (!feature) {
    console.error('没有找到对应的地理区域：', question.name)
    return null
  }

  // 点击区域内部，距离为0
  if (turf.booleanPointInPolygon(clickedPoint, feature)) {
    return 0
  }

  const geometry = feature.geometry
  let polygons = []

  if (geometry.type === 'Polygon') {
    polygons = [geometry.coordinates]
  } else if (geometry.type === 'MultiPolygon') {
    polygons = geometry.coordinates
  } else {
    console.error('不支持的地理类型：', geometry.type)
    return null
  }

  let minDistance = Infinity

  for (const polygon of polygons) {
    for (const ring of polygon) {
      const boundaryLine = turf.lineString(ring)

      const distance = turf.pointToLineDistance(
        clickedPoint,
        boundaryLine,
        { units: 'kilometers' }
      )

      minDistance = Math.min(minDistance, distance)
    }
  }

  return Number.isFinite(minDistance) ? minDistance : null
}


let marker = null
let answerMarker = null
let hasConfirmed = Number(cloudSession?.session?.current_question || 1) > 5

// 答案展示结束后返回中国全景
let answerMoveEndHandler = null
let returnToOverviewTimer = null



const restoredAnswers = cloudSession?.answers || []

let totalScore = restoredAnswers.reduce(
  (sum, item) => sum + Number(item.score || 0),
  0
)

let questionScores = restoredAnswers.map(item => Number(item.score || 0))
let questionDistances = restoredAnswers.map(item => Number(item.distance_km || 0))
let questionGuesses = restoredAnswers.map(item => item.guess_coordinates)

let currentQuestion = Math.max(
  1,
  Math.min(6, Number(cloudSession?.session?.current_question || 1))
)

// 临时诊断日志
console.log('[DEBUG] 当前玩家云端会话：', cloudSession)
console.log('[DEBUG] 当前题号：', currentQuestion)
console.log('[DEBUG] 当前玩家答题记录：', cloudSession?.answers)

let correctAnswer = questions[currentQuestion - 1]?.coordinates || null

// 根据实际偏差距离统一确定成绩颜色和分享表情
function getDistanceLevel(distance) {
  if (distance <= 10) return { color: 'gold', emoji: '🏆' }
  if (distance <= 50) return { color: 'green', emoji: '🎯' }
  if (distance <= 100) return { color: 'blue', emoji: '🔥' }
  if (distance <= 200) return { color: 'cyan', emoji: '👍' }
  if (distance <= 500) return { color: 'orange', emoji: '🧭' }
  return { color: 'red', emoji: '🌱' }
}
// 生成最终成绩总览

// 生成最终成绩总览
function renderResultsSummary() {
  document.querySelector('#final-score').textContent = totalScore

  const maxScores = [100, 100, 200, 300, 300]

  // 六档颜色
  const colors = {
    gold: '#f5c542',
    green: '#28b879',
    blue: '#3984ff',
    cyan: '#22cddd',
    orange: '#f08a35',
    red: '#df4848'
  }

  // 生成五个彩色圆点
  const dotsHTML = questionScores.map((score, index) => {
    const level = getDistanceLevel(questionDistances[index])
    const color = colors[level.color] || colors.red

    return `
      <div class="result-dot"
           style="background-color:${color};">
      </div>
    `
  }).join('')

  document.querySelector('#results-dots').innerHTML = dotsHTML

  // 生成五道题的彩色成绩柱
  const barsHTML = questionScores.map((score, index) => {
    const ratio = score / maxScores[index]
    const percentage = Math.max(0, Math.min(100, ratio * 100))

    const level = getDistanceLevel(questionDistances[index])
    const color = colors[level.color] || colors.red

    return `
      <div class="result-bar-row">
        <div class="result-bar-label">Q${index + 1}</div>

        <div class="result-bar-track">
          <div class="result-bar-fill"
               style="width:${percentage}%; background-color:${color};">
          </div>
        </div>

        <div class="result-bar-score">${score}</div>
      </div>
    `
  }).join('')

  document.querySelector('#results-bars').innerHTML = barsHTML
}



// 生成个人定位距离分布
function renderDistanceDistribution() {
  const ranges = [
    { label: '0–10 公里', min: 0, max: 10 },
    { label: '10–50 公里', min: 10, max: 50 },
    { label: '50–100 公里', min: 50, max: 100 },
    { label: '100–200 公里', min: 100, max: 200 },
    { label: '200–500 公里', min: 200, max: 500 },
    { label: '500 公里以上', min: 500, max: Infinity }
  ]

  const total = questionDistances.length

  const counts = ranges.map((range, index) => {
    return questionDistances.filter(distance =>
      index === 0
        ? distance >= range.min && distance <= range.max
        : distance > range.min && distance <= range.max
    ).length
  })

  const chartHTML = ranges.map((range, index) => {
    const count = counts[index]
    const percentage = total > 0 ? count / total * 100 : 0

    return `
      <div class="distance-row">
        <div class="distance-label">${range.label}</div>
        <div class="distance-track">
          <div class="distance-fill"
               style="width:${percentage}%"></div>
        </div>
        <div class="distance-count">${count} 次</div>
      </div>
    `
  }).join('')

  document.querySelector('#distance-chart').innerHTML = chartHTML

  document.querySelector('#distance-summary').textContent =
    `共完成 ${total} 次定位，平均偏差 ${
      total > 0
        ? (questionDistances.reduce((sum, d) => sum + d, 0) / total).toFixed(1)
        : 0
    } 公里`
}
// 生成五道题的详细结果
function renderDetailedResults() {
  const resultsHTML = questions.map((question, index) => {
    const score = questionScores[index]

    return `
      <div class="detail-card">
        <div class="detail-card-heading">
          <span>Q${index + 1}</span>
          <span>${score} 分</span>
        </div>

        <div class="detail-city">${question.name}</div>

        <figure class="detail-photo-wrap">
          <img class="detail-photo" src="${question.image}" alt="${question.name}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
          <div class="detail-photo-fallback" style="display:none;">图片暂时无法加载</div>
          <figcaption class="detail-photo-credit">${question.imageCredit} · <a href="${question.imageLicense}" target="_blank" rel="noopener noreferrer">${question.imageLicenseName}</a></figcaption>
        </figure>

        <div class="detail-knowledge">
          <div class="detail-knowledge-title">地理知识</div>
          <p>${question.knowledge}</p>
        </div>
      </div>
    `
  }).join('')

  document.querySelector('#detailed-results-list').innerHTML = resultsHTML
}
  // 生成五道题的独立地图
function renderDetailMaps() {
  questions.forEach((question, index) => {
    const guess = questionGuesses[index]
    const answer = question.coordinates

    if (!guess || !answer) return

    const detailMap = new Map({
      container: `detail-map-${index}`,

      style: {
        version: 8,
        sources: {
          geovis: {
            type: 'raster',
            tiles: [
              'https://api.open.geovisearth.com/pj/base/v1/2025/{z}/{x}/{y}?format=webp&tmsIds=w&token=' + token
            ],
            tileSize: 256,
            attribution: '© Geovis'
          },
          province: {
            type: 'geojson',
            data: provinceData
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'geovis'
          },
          {
            id: 'province-boundaries',
            type: 'line',
            source: 'province',
            paint: {
              'line-color': '#ffffff',
              'line-width': 0.5,
              'line-opacity': 0.6
            }
          }
        ]
      },

      projection: {
        type: 'mercator'
      },
      
      renderWorldCopies: false,
      
      center: answer,
      zoom: 3,
      interactive: false,
      attributionControl: false
    })

    detailMap.on('load', () => {
      detailMap.addSource(`route-${index}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [guess, answer]
          }
        }
      })

      detailMap.addLayer({
        id: `route-glow-${index}`,
        type: 'line',
        source: `route-${index}`,
        paint: {
          'line-color': '#8feaff',
          'line-width': 8,
          'line-blur': 3,
          'line-opacity': 0.38
        }
      })

      detailMap.addLayer({
        id: `route-${index}`,
        type: 'line',
        source: `route-${index}`,
        paint: {
          'line-color': '#f5fdff',
          'line-width': 2.2,
          'line-opacity': 0.95
        }
      })

      detailMap.addSource(`points-${index}`, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: guess
              },
              properties: {
                type: 'guess'
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: answer
              },
              properties: {
                type: 'answer'
              }
            }
          ]
        }
      })

      detailMap.addLayer({
        id: `points-${index}`,
        type: 'circle',
        source: `points-${index}`,
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'type'],
            'guess', '#ef4444',
            'answer', '#2563eb',
            '#ffffff'
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5
        }
      })

      // 自动计算正确的地图边界
const west = Math.min(guess[0], answer[0])
const east = Math.max(guess[0], answer[0])
const south = Math.min(guess[1], answer[1])
const north = Math.max(guess[1], answer[1])

detailMap.fitBounds(
  [
    [west, south],
    [east, north]
  ],
  {
    padding: {
      top: 45,
      bottom: 45,
      left: 55,
      right: 55
    },
    maxZoom: 9,
    duration: 0
  }
)
    })
  })
}
document.querySelector('#progress').textContent =
  currentQuestion <= 5 ? `第 ${currentQuestion} / 5 题` : '今日挑战已完成'
document.querySelector('#score-value').textContent = totalScore
document.querySelector('#coordinates').textContent =
  currentQuestion <= 5
    ? (questions[currentQuestion - 1].question || `第${currentQuestion}题`)
    : '今日五道题已全部完成'
// 地图点击：记录玩家选择的位置
map.on('click', (e) => {
  if (hasConfirmed) return

  const { lng, lat } = e.lngLat

  document.querySelector('#coordinates').textContent =
    `经度：${lng.toFixed(4)}，纬度：${lat.toFixed(4)}`

  if (marker) {
    marker.setLngLat([lng, lat])
  } else {
    marker = new Marker({
      color: '#ff3333'
    })
      .setLngLat([lng, lat])
      .addTo(map)
  }

  console.log('点击位置：', lng, lat)
})
// iPhone Safari / 微信浏览器：首次用户触摸时解锁音频
document.addEventListener('touchstart', unlockGameAudio, {
  once: true,
  passive: true
})

document.addEventListener('pointerdown', unlockGameAudio, {
  once: true,
  passive: true
})

// 游戏音效

// 游戏音效：兼容 iPhone Safari 和微信内置浏览器
let audioContext = null

function getAudioContext() {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext

  if (!AudioContextClass) return null

  if (!audioContext) {
    audioContext = new AudioContextClass()
  }

  return audioContext
}

// 在用户第一次触摸页面时解锁音频
function unlockGameAudio() {
  const context = getAudioContext()
  if (!context) return

  if (context.state === 'suspended') {
    context.resume().catch(error => {
      console.warn('音频引擎启动失败：', error)
    })
  }
}

// 播放游戏音效
async function playGameSound(type) {
  const context = getAudioContext()
  if (!context) return

  try {
    if (context.state !== 'running') {
      await context.resume()
    }

    if (context.state !== 'running') return

    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.connect(gain)
    gain.connect(context.destination)

    if (type === 'connect') {
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(260, now)
      oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.25)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

      oscillator.start(now)
      oscillator.stop(now + 0.3)
    }

    if (type === 'hit') {
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, now)
      oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.12)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.16, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      oscillator.start(now)
      oscillator.stop(now + 0.36)
    }
  } catch (error) {
    console.warn('游戏音效播放失败：', error)
  }
}


// 如果玩家刷新页面时今日挑战已经完成，直接恢复成绩页。
if (currentQuestion > 5) {
  renderResultsSummary()
  renderDistanceDistribution()
  renderDetailedResults()
  document.querySelector('#results-screen').style.display = 'block'
  document.querySelector('#confirm').disabled = true
  document.querySelector('#next-question').style.display = 'none'
}

// 确认位置：完整的答题处理流程
document.querySelector('#confirm').addEventListener('click', async () => {
  if (!marker || hasConfirmed || currentQuestion > 5) return

  const start = [
    marker.getLngLat().lng,
    marker.getLngLat().lat
  ]

  const confirmButton = document.querySelector('#confirm')
  confirmButton.disabled = true

  const originalConfirmText = confirmButton.textContent
  confirmButton.textContent = '正在核验…'
  document.querySelector('#coordinates').textContent = '正在提交并核验位置，请稍候…'

  let serverResult
  try {
    serverResult = await submitTodayAnswer(currentQuestion, start)
  } catch (error) {
    console.error('服务器提交答案失败：', error)
    confirmButton.disabled = false
    confirmButton.textContent = originalConfirmText
    document.querySelector('#coordinates').textContent =
      `提交失败：${error.message || '请检查网络后重试'}`
    return
  }

  const distance = Number(serverResult?.answer?.distance_km)
  const currentQuestionData = questions[currentQuestion - 1]
  if (!Number.isFinite(distance) || !serverResult?.reveal) {
    confirmButton.disabled = false
    confirmButton.textContent = originalConfirmText
    document.querySelector('#coordinates').textContent = '服务器返回的数据不完整，请重试'
    return
  }

  applyCloudReveal(currentQuestionData, serverResult.reveal)

  // 有行政区代码且服务端省略了大体积 geometry 时，从已并行加载的本地区划数据取边界。
  if (
    currentQuestionData.type !== 'mountain' &&
    !currentQuestionData.answerGeometry &&
    currentQuestionData.adcode
  ) {
    const adminDataReady = await (
      currentQuestionData.level === 'province'
        ? provinceGeoJSONPromise
        : cityGeoJSONPromise
    )
    if (!adminDataReady) {
      confirmButton.disabled = false
      confirmButton.textContent = originalConfirmText
      document.querySelector('#coordinates').textContent =
        '答案已由服务器核验，但本地区划数据加载失败。请刷新页面后重试查看答案。'
      return
    }
  }

  correctAnswer = currentQuestionData.coordinates
  if (!Array.isArray(correctAnswer) || correctAnswer.length !== 2) {
    confirmButton.disabled = false
    confirmButton.textContent = originalConfirmText
    document.querySelector('#coordinates').textContent = '答案坐标数据异常，请联系管理员'
    return
  }

  hasConfirmed = true
  questionGuesses.push([...start])

  const end = correctAnswer

  // 显示正确答案标记
  if (answerMarker) {
    answerMarker.remove()
  }

  answerMarker = new Marker({
    color: '#2563eb'
  })
    .setLngLat(correctAnswer)
    .addTo(map)

  // 清理上一题的正确答案区域
  if (map.getLayer('answer-region-outline')) {
    map.removeLayer('answer-region-outline')
  }

  if (map.getLayer('answer-region-fill')) {
    map.removeLayer('answer-region-fill')
  }

  if (map.getSource('answer-region')) {
    map.removeSource('answer-region')
  }

  // 高亮正确答案的行政区
  const answerFeature =
    currentQuestionData.type === 'mountain'
      ? null
      : getAnswerFeature(currentQuestionData)
  
        // 飞向答案结束后，停留2秒，再平滑缩回中国全景
  if (answerFeature || currentQuestionData.type === 'mountain') {
    answerMoveEndHandler = () => {
      map.off('moveend', answerMoveEndHandler)
      answerMoveEndHandler = null

      returnToOverviewTimer = setTimeout(() => {
        map.easeTo({
          center: [104, 35],
          zoom: 2.8,
          duration: 1500
        })

        returnToOverviewTimer = null
      }, 2000)
    }

    map.on('moveend', answerMoveEndHandler)
  }
  if (answerFeature) {
    map.addSource('answer-region', {
      type: 'geojson',
      data: answerFeature
    })
  
    map.addLayer({
      id: 'answer-region-fill',
      type: 'fill',
      source: 'answer-region',
      paint: {
        'fill-color': '#2563eb',
        'fill-opacity': 0.22
      }
    })
  
    map.addLayer({
      id: 'answer-region-outline',
      type: 'line',
      source: 'answer-region',
      paint: {
        'line-color': '#60a5fa',
        'line-width': 3,
        'line-opacity': 1
      }
    })
  
    const bounds = turf.bbox(answerFeature)
  
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ],
      {
        padding: {
          top: 100,
          bottom: 100,
          left: 80,
          right: 80
        },
        maxZoom: 7,
        duration: 1200
      }
    )
  }
  if (currentQuestionData.type === 'mountain') {
    map.flyTo({
      center: currentQuestionData.coordinates,
      zoom: 7,
      duration: 1200
    })
  }

  // 清理上一题遗留的连线与光点
  if (map.getLayer('answer-line-head-core')) map.removeLayer('answer-line-head-core')
  if (map.getLayer('answer-line-head-glow')) map.removeLayer('answer-line-head-glow')
  if (map.getLayer('answer-line-layer')) map.removeLayer('answer-line-layer')
  if (map.getLayer('answer-line-glow')) map.removeLayer('answer-line-glow')
  if (map.getSource('answer-line-head')) map.removeSource('answer-line-head')
  if (map.getSource('answer-line')) map.removeSource('answer-line')

  // 创建玩家位置到正确答案的连线
  map.addSource('answer-line', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [start, start]
      }
    }
  })

  // 白色主线 + 冰蓝柔光，线条保持纤细清晰
  map.addLayer({
    id: 'answer-line-glow',
    type: 'line',
    source: 'answer-line',
    paint: {
      'line-color': '#78ddff',
      'line-width': 11,
      'line-blur': 4,
      'line-opacity': 0.42
    }
  })

  map.addLayer({
    id: 'answer-line-layer',
    type: 'line',
    source: 'answer-line',
    paint: {
      'line-color': '#f7fdff',
      'line-width': 2.8,
      'line-opacity': 0.98
    }
  })

  // 光束前端的能量光点
  map.addSource('answer-line-head', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: start }
    }
  })

  map.addLayer({
    id: 'answer-line-head-glow',
    type: 'circle',
    source: 'answer-line-head',
    paint: {
      'circle-radius': 9,
      'circle-color': '#8be7ff',
      'circle-blur': 0.7,
      'circle-opacity': 0.9
    }
  })

  map.addLayer({
    id: 'answer-line-head-core',
    type: 'circle',
    source: 'answer-line-head',
    paint: {
      'circle-radius': 3.2,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#b9f2ff',
      'circle-stroke-width': 1
    }
  })

  // 播放连线动画：短暂蓄力，再快速发射，抵达时脉冲揭晓
  playGameSound('connect')

  const duration = 760
  const startTime = performance.now() + 90

  function animateLine(now) {
    if (now < startTime) {
      requestAnimationFrame(animateLine)
      return
    }

    const rawProgress = Math.min((now - startTime) / duration, 1)
    // 前段迅速推进，末段稍作减速，形成抵达感
    const progress = 1 - Math.pow(1 - rawProgress, 2.2)

    const current = [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress
    ]

    map.getSource('answer-line').setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [start, current]
      }
    })

    map.getSource('answer-line-head').setData({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: current }
    })

    if (rawProgress < 1) {
      requestAnimationFrame(animateLine)
    } else {
      // 终点短促扩散，随后播放命中音
      map.setPaintProperty('answer-line-head-glow', 'circle-radius', 15)
      map.setPaintProperty('answer-line-head-glow', 'circle-opacity', 0.35)
      playGameSound('hit')
      setTimeout(() => {
        if (map.getLayer('answer-line-head-glow')) {
          map.setPaintProperty('answer-line-head-glow', 'circle-radius', 9)
          map.setPaintProperty('answer-line-head-glow', 'circle-opacity', 0.65)
        }
      }, 180)
    }
  }

  requestAnimationFrame(animateLine)

  // 正式分数由服务器计算并返回；客户端只负责展示。
  const score = Number(serverResult.answer.score)

  questionScores.push(score)
  questionDistances.push(distance)

  totalScore += score

  document.querySelector('#score-value').textContent = totalScore

  // 显示本题结果：根据实际偏差距离给出评价
  setTimeout(() => {
    let feedback = ''

    // 距离边界归入较近的一档：10、50、100、200、500 公里均包含在前一档
    if (distance <= 10) {
      feedback = '地理之神！几乎分毫不差！'
    } else if (distance <= 50) {
      feedback = '精准定位！你对中国地图了如指掌！'
    } else if (distance <= 100) {
      feedback = '相当厉害！你已经非常接近目标了！'
    } else if (distance <= 200) {
      feedback = '方向感不错！离正确答案只有一步之遥！'
    } else if (distance <= 500) {
      feedback = '地图还没征服！再接再厉，下一次争取更进一步！'
    } else {
      feedback = '继续探索！中国很大，下一题再找准方向！'
    }
    
document.querySelector('#coordinates').innerHTML =
  `距离正确答案：${distance.toFixed(1)} 公里<br><span class="distance-feedback">${feedback}</span>`
      // 显示当前地点的知识介绍
document.querySelector('#location-info-title').textContent =
  currentQuestionData.topic || currentQuestionData.name

document.querySelector('#location-info-content').innerHTML = `
  <p>${currentQuestionData.knowledge}</p>
  <p>${currentQuestionData.fact}</p>
`
// 每次揭晓新答案，正文默认恢复收起状态
locationInfo.classList.remove('is-expanded')
locationInfoToggle.textContent = '展开全文⌄'
locationInfoToggle.setAttribute('aria-expanded', 'false')
document.querySelector('#location-info').style.display = 'block'

    document.querySelector('#next-question').style.display = 'block'

    // 最后一题
    if (currentQuestion >= questions.length) {
 

      // 最后一题不自动跳转，显示按钮让玩家主动进入详细结果页
      document.querySelector('#next-question').textContent = '挑战完成✅'
      document.querySelector('#next-question').style.display = 'block'
    }
  }, 550)

  document.querySelector('#confirm').textContent = '已确认'
  document.querySelector('#confirm').disabled = true

  document.querySelector('#coordinates').textContent += '（已确认）'
})


// 分享成绩卡：预览、系统分享、复制链接、保存图片

document.querySelector('#share-score').addEventListener('click', async () => {
  const getEmoji = distance => getDistanceLevel(distance).emoji

  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 420

  const ctx = canvas.getContext('2d')

  // 成绩卡白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 1000, 420)

  // TXT / 终端风格
  const monoFont =
    '28px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

  ctx.fillStyle = '#222222'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = monoFont

  const dateText = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())

  ctx.fillText(`中国地理挑战  /  ${dateText}`, 65, 115)

  const scoreParts = questionScores.map((score, index) => {
    return `${score} ${getEmoji(questionDistances[index])}`
  })

  ctx.font =
    '30px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

  ctx.fillText(scoreParts.join('    '), 65, 210)

  ctx.font = monoFont
  ctx.fillText(`今日战绩：${totalScore}`, 65, 305)

  try {
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png')
    })

    if (!blob) {
      throw new Error('成绩图片生成失败')
    }

    const imageUrl = URL.createObjectURL(blob)

    const gameUrl = 'https://china-geo-game.vercel.app/'
    const inviteText =
      '来挑战中国地理！看看你能拿多少分：\n' + gameUrl

    // 创建分享窗口
    let modal = document.querySelector('#custom-share-modal')

    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'custom-share-modal'

      modal.innerHTML = `
        <div class="custom-share-panel">

          <button class="custom-share-close" aria-label="关闭">×</button>

          <img class="custom-share-preview" alt="成绩卡预览">

          <button class="custom-share-native" type="button">
            分享图片和链接
          </button>

          <div class="custom-share-link">
            <a
              class="custom-share-url"
              href="${gameUrl}"
              target="_blank"
              rel="noopener noreferrer"
            >${gameUrl}</a>

            <button class="custom-share-copy" type="button">
              复制邀请链接
            </button>
          </div>

          <button class="custom-share-save" type="button">
            保存成绩图片
          </button>

          <div class="custom-share-feedback"></div>

        </div>
      `

      document.body.appendChild(modal)

      // 关闭窗口
      modal.querySelector('.custom-share-close').addEventListener('click', () => {
        modal.style.display = 'none'
      })

      modal.addEventListener('click', event => {
        if (event.target === modal) {
          modal.style.display = 'none'
        }
      })

      // 保存图片
      const saveImage = () => {
        const link = document.createElement('a')
        link.href = modal.querySelector('.custom-share-preview').src
        link.download = '中国地理挑战-成绩卡.png'
        link.click()
      }

      // 复制邀请链接
      const copyInviteLink = async () => {
        try {
          await navigator.clipboard.writeText(inviteText)
          return true
        } catch (error) {
          const textarea = document.createElement('textarea')
          textarea.value = inviteText
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'

          document.body.appendChild(textarea)
          textarea.select()

          const copied = document.execCommand('copy')
          textarea.remove()

          return copied
        }
      }

      // 调用手机系统分享菜单
      modal.querySelector('.custom-share-native').addEventListener('click', async () => {
        const feedback = modal.querySelector('.custom-share-feedback')
        const blob = modal.shareBlob

        try {
          if (
            navigator.share &&
            navigator.canShare &&
            typeof File !== 'undefined'
          ) {
            const file = new File(
              [blob],
              '中国地理挑战-成绩卡.png',
              { type: 'image/png' }
            )

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: '中国地理挑战',
                text: inviteText,
                files: [file]
              })

              feedback.textContent = '分享菜单已打开，选择你想使用的应用即可。'
              return
            }
          }

          // 当前设备不支持图片系统分享时，使用备用方案
          saveImage()

          const copied = await copyInviteLink()

          feedback.textContent = copied
            ? '此设备暂不支持直接分享图片，成绩图片已保存，邀请链接已复制。'
            : '此设备暂不支持直接分享图片，请保存成绩图片并手动复制上方链接。'

        } catch (error) {
          if (error.name === 'AbortError') {
            feedback.textContent = '已取消分享。'
          } else {
            console.error('系统分享失败：', error)
            feedback.textContent = '系统分享暂不可用，可以使用下面的复制链接和保存图片功能。'
          }
        }
      })

      // 单独复制链接
      modal.querySelector('.custom-share-copy').addEventListener('click', async () => {
        const feedback = modal.querySelector('.custom-share-feedback')
        const copied = await copyInviteLink()

        feedback.textContent = copied
          ? '邀请链接已复制，可以粘贴到微信或其他应用。'
          : '复制失败，请长按上方链接手动复制。'
      })

      // 单独保存成绩图片
      modal.querySelector('.custom-share-save').addEventListener('click', () => {
        saveImage()
        modal.querySelector('.custom-share-feedback').textContent =
          '成绩图片已保存。'
      })
    }

    const preview = modal.querySelector('.custom-share-preview')

    if (preview.dataset.previousUrl) {
      URL.revokeObjectURL(preview.dataset.previousUrl)
    }

    preview.src = imageUrl
    preview.dataset.previousUrl = imageUrl

    // 保存本次成绩图片的 Blob，供系统分享使用
    modal.shareBlob = blob

    modal.querySelector('.custom-share-feedback').textContent = ''
    modal.style.display = 'flex'

    document.querySelector('#share-feedback').textContent = ''

  } catch (error) {
    console.error('成绩图片生成失败：', error)

    document.querySelector('#share-feedback').textContent =
      '成绩图片生成失败，请稍后重试'
  }
})


document.querySelector('#next-question').addEventListener('click', () => {
    // 进入下一题时，取消上一题尚未执行的返回全景动作
    if (answerMoveEndHandler) {
      map.off('moveend', answerMoveEndHandler)
      answerMoveEndHandler = null
    }
  
    if (returnToOverviewTimer) {
      clearTimeout(returnToOverviewTimer)
      returnToOverviewTimer = null
    }
  
    // 停止上一题可能尚未结束的地图动画
    map.stop()
  // 最后一题的按钮负责进入详细结果页，不再执行下一题逻辑
  if (currentQuestion >= questions.length) {
    renderResultsSummary()
    renderDistanceDistribution()
    renderDetailedResults()
    document.querySelector('#results-screen').style.display = 'block'
    return
  }

    // 隐藏上一题的地点介绍
  document.querySelector('#location-info').style.display = 'none'

  // 进入新题前，清除上一题高亮的行政区蓝色边框和填充
  if (map.getLayer('answer-region-outline')) {
    map.removeLayer('answer-region-outline')
  }
  if (map.getLayer('answer-region-fill')) {
    map.removeLayer('answer-region-fill')
  }
  if (map.getSource('answer-region')) {
    map.removeSource('answer-region')
  }
  if (marker) {
    marker.remove()
    marker = null
  }

  if (answerMarker) {
    answerMarker.remove()
    answerMarker = null
  }
  
  if (map.getLayer('answer-line-head-core')) map.removeLayer('answer-line-head-core')
  if (map.getLayer('answer-line-head-glow')) map.removeLayer('answer-line-head-glow')
  if (map.getLayer('answer-line-glow')) map.removeLayer('answer-line-glow')
  if (map.getLayer('answer-line-layer')) map.removeLayer('answer-line-layer')
  if (map.getSource('answer-line-head')) map.removeSource('answer-line-head')
  if (map.getSource('answer-line')) map.removeSource('answer-line')
// 恢复地图初始视野
map.easeTo({
  center: [104, 35],
  zoom: 2.8,
  duration: 800
})
  hasConfirmed = false
  currentQuestion++
  document.querySelector('#progress').textContent =
  `第 ${currentQuestion} / 5 题`
  console.log('当前题号：', currentQuestion)
correctAnswer = questions[currentQuestion - 1].coordinates

 document.querySelector('#coordinates').textContent =
  questions[currentQuestion - 1].question || `第${currentQuestion}题：请找到${questions[currentQuestion - 1].name}`

  document.querySelector('#confirm').textContent = '确认位置'
  document.querySelector('#confirm').disabled = false

  document.querySelector('#next-question').style.display = 'none'
})


document.querySelector('#track-stats').addEventListener('click', async () => {
  const button = document.querySelector('#track-stats')
  const status = document.querySelector('#today-leaderboard-status')
  const list = document.querySelector('#today-leaderboard')
  button.disabled = true
  status.textContent = '正在加载今日统计和排行榜…'

  try {
    const [statsResult, boardResult] = await Promise.all([
      getTodayStats(),
      getTodayLeaderboard(50)
    ])

    document.querySelector('#today-average-score').textContent = statsResult.participant_count
      ? `${statsResult.average_score} 分`
      : '暂无'
    document.querySelector('#today-participant-count').textContent = String(statsResult.participant_count || 0)
    document.querySelector('#today-easiest-question').textContent = statsResult.easiest_question
      ? `第 ${statsResult.easiest_question} 题`
      : '暂无'
    document.querySelector('#today-hardest-question').textContent = statsResult.hardest_question
      ? `第 ${statsResult.hardest_question} 题`
      : '暂无'

    list.replaceChildren()
    const rows = boardResult.leaderboard || []
    if (!rows.length) {
      status.textContent = '今天还没有玩家完成挑战，成为第一个登上排行榜的人吧！'
    } else {
      status.textContent = `今日排行榜 · 前 ${rows.length} 名`
      rows.forEach((row, index) => {
        const item = document.createElement('div')
        item.style.cssText = 'display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(148,163,184,.18);border-radius:10px;background:rgba(15,23,42,.55);color:#e2e8f0;'
        const rank = document.createElement('strong')
        rank.textContent = String(index + 1).padStart(2, '0')
        rank.style.cssText = 'color:#f5c542;font-variant-numeric:tabular-nums;'
        const name = document.createElement('span')
        name.textContent = row.display_name || '匿名玩家'
        name.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
        const score = document.createElement('strong')
        score.textContent = `${Number(row.total_score || 0)} 分`
        score.style.cssText = 'font-variant-numeric:tabular-nums;'
        item.append(rank, name, score)
        list.append(item)
      })
    }
    document.querySelector('#daily-stats').scrollIntoView({behavior:'smooth', block:'start'})
  } catch (error) {
    console.error('加载排行榜失败：', error)
    status.textContent = `加载失败：${error.message || '请稍后重试'}`
  } finally {
    button.disabled = false
  }
})
document.querySelector('#more-challenges-button')
  .addEventListener('click', () => {
    document.querySelector('#more-challenges-feedback')
      .textContent = '更多挑战正在开发中，敬请期待！'
  })
  document.querySelector('#back-to-game').addEventListener('click', () => {
    document.querySelector('#results-screen').style.display = 'none'
  
    const locationInfo = document.querySelector('#location-info')
    if (locationInfo) {
      locationInfo.style.display = 'none'
    }
  
    document.querySelector('#confirm').disabled = true
    document.querySelector('#next-question').style.display = 'none'
  
    map.resize()
    map.easeTo({
      center: [104, 35],
      zoom: 2.8,
      duration: 800
    })
  })