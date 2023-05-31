const socket = io()

const question = document.querySelector('.view-question')
const answers = document.querySelector('.view-answers')
const timer = document.querySelector('.timer')
const info = document.querySelector('.js-info')
const intro = document.querySelector('.js-intro')
const container = document.querySelector('.js-container')
const card = document.querySelector('.js-card')
const cardBack = document.querySelector('.js-back')
const $showImg = document.querySelector('.js-show-img')
const $scoreBoard = document.querySelector('.js-score-board')

let correctAnswer = ''
let chosenAnswer = null
let clockTimer = null
let timeLeft = 0
let pauseTime = false
let pauseMusic = true
let showBuzzTeam = false
let questionReady = false
let pauseSoundFX = false

let s_correct = new Audio(`fx/correct.mp3`)
let s_wrong = new Audio(`fx/wrong.mp3`)
let s_lock = new Audio(`fx/lock.wav`)
let s_buzz = new Audio(`fx/buzz.wav`)

let s_10sec = new Audio(`timer/10sec.mp3`)
let s_30sec = new Audio(`timer/30sec.mp3`)
let s_60sec = new Audio(`timer/60sec.mp3`)


let introTrack = []
for (let i = 1; i <= 3; i++)
  introTrack.push(new Audio(`tracks/intro${i}.mp3`))

introTrack.forEach(track => {
  track.addEventListener('ended', () => {
    socket.emit('introTrackEnded')
  })
  track.volume = 0.1
})

let currentIntroTrack = 0
let allIntroTracks = x = introTrack.length


let showdownTrack = new Audio(`tracks/showdown.mp3`)
let pauseShowdownMusic = true


showdownTrack.volume = 0.1
showdownTrack.addEventListener('ended', () => {
  showdownTrack.currentTime = 0
  showdownTrack.play()
})
let tracks = [];
for (let i = 3; i <= 5; i++)
  tracks.push(new Audio(`tracks/track${i}.mp3`))

// tracks.sort(function() {return 0.5 - Math.random()})

let currentTrack = 0
let allTracks = x = tracks.length

while (x--) {
  //tracks[x].addEventListener('ended',playNextTrack)
  tracks[x].volume = 0.1
  tracks[x].loop = true
}


let QuestionSeconds = 0

let startTimerTimer =
  cardBackTimer =
  cardTimer = null
let answer1Timer, answer2Timer, answer3Timer,
  answer4Timer, questionReadyTimer, showCorrectAnswerTimer

let words = ''

socket.on('connected', (data) => {
  pauseTime = data.pauseTime
  pauseMusic = data.pauseMusic
  pauseSoundFX = data.pauseSoundFX
  pauseShowdownMusic = data.pauseShowdownMusic

  setMusicVolume(data.musicVol)
  setTimerVolume(data.timerVol)
  playMusic()

  if (data.questionReady) {
    socket.emit('clear')
    prepareQuestion(data)
  }



})


socket.on('buzzes', (buzzes) => {
  if (isQuestionClosed()) return
  if (showBuzzTeam && buzzes.length) {
    showBuzzTeam = false
    info.innerHTML = `Team ${buzzes[0]}`
    info.classList.add('info-display')
    if (!pauseSoundFX) s_buzz.play()
  }

})

socket.on('clear', () => {
  if (chosenAnswer === null) {
    const choice = document.querySelector('li.highlight')
    info.classList.remove('info-display')
    if (choice) choice.classList.remove('highlight')
    showBuzzTeam = true
    info.innerHTML = ''
  }
})

socket.on('intro', () => {
  questionClose(false)
  intro.classList.remove('hidden')
  container.classList.add('hidden')
})

socket.on('question', (data) => {
  prepareQuestion(data)
})

socket.on('showScoresToggle', (score) => {
  showScoresToggle(score)
})

socket.on('setBG', (bgClass) => {
  document.body.classList.remove(...document.body.classList)
  document.body.classList.add(bgClass)

  const num = (bgClass.match(/\d/g).at(0) - 1)
  setIntroTrack(num)
})

socket.on('showImgtoggle', () => {
  $showImg.toggleAttribute('hidden')
})


function prepareQuestion(data) {
  clearTimeout(startTimerTimer)
  clearTimeout(cardBackTimer)
  clearTimeout(cardTimer)
  clearTimeout(answer1Timer)
  clearTimeout(answer2Timer)
  clearTimeout(answer3Timer)
  clearTimeout(answer4Timer)
  clearTimeout(questionReadyTimer)
  clearTimeout(showCorrectAnswerTimer)

  introTrack[currentIntroTrack].pause()
  pauseTimerMusic()
  showBuzzTeam = true
  info.classList.remove('info-display')
  info.classList.remove('wrong')
  info.classList.remove('correct')
  cardBack.classList.add('hide')
  intro.classList.add('hidden')
  container.classList.remove('hidden')


  card.classList.remove('flipped')

  displayChoices(data)
  setTimer()
  startTimerTimer = setTimeout(startTimer, 2500)

  cardBackTimer = setTimeout(() => {
    cardBack.classList.remove('hide')
  }, 1000)
  cardTimer = setTimeout(() => {
    card.classList.add('flipped')
  }, 1500)
}

socket.on('answerSelected', (choice) => {
  if (isQuestionClosed()) return
  highlightChoice(choice)
})

function highlightChoice(choice) {
  const choices = document.querySelectorAll('li[data-choice]')
  choices.forEach((input) => {
    input.classList.remove('highlight')
    if (input.dataset.choice === choice) {
      input.classList.add('highlight')
    }
  })
}

socket.on('answerlock', (answerChosen) => {
  if (isQuestionClosed()) return
  highlightChoice(answerChosen)
  const choice = document.querySelector('li.highlight')
  if (choice) choice.classList.add('locked')
  pauseTime = true
  chosenAnswer = answerChosen
  questionClose()
  if (!pauseSoundFX) s_lock.play()
})

function isQuestionClosed() {
  return !!(chosenAnswer !== null || !questionReady)
}

socket.on('pauseQuestion', (timeState) => {
  if (timeLeft > 0 && clockTimer) {
    pauseTime = timeState
  }
})

socket.on('musicToggle', (musicStop) => {
  pauseMusic = musicStop
  playMusic()
})

function playMusic() {
  if (pauseMusic) {
    stopTrack()
  } else {
    playTrack()
  }
}

socket.on('introMusicToggle', (musicStop, track) => {
  if (musicStop) {
    introTrack[currentIntroTrack].pause()
    introTrack.currentTime = 0
  } else {
    introTrack[currentIntroTrack].play()
  }
})

socket.on('showdownMusicToggle', (musicStop) => {
  pauseShowdownMusic = musicStop
  playMusic()
})

socket.on('musicVolume', (musicVol) => {
  setMusicVolume(musicVol)
})

socket.on('timerVolume', (musicVol) => {
  setTimerVolume(musicVol)
})

socket.on('soundFXToggle', (soundFX) => {
  pauseSoundFX = soundFX
})


socket.on('selectionToggle', (data) => {
  if (!data.allowSelection)
    highlightChoice(null)
})

socket.on('skipTrack', () => {
  playNextTrack()
})

socket.on('skipIntroTrack', () => {
  console.log('skip intro')
  playNextIntroTrack()
})


function displayChoices(data) {
  console.log('what is going on?', data)
  info.innerHTML = ''
  answers.innerHTML = ''
  question.innerHTML = ''

  $showImg.innerHTML = ''
  $showImg.toggleAttribute('hidden', true)
  if (data.img && data.img.length) {
    $showImg.innerHTML = `<img src="${data.img}" />`
  }

  chosenAnswer = null
  if (data.choices && data.choices.length) {
    correctAnswer = data.answer
    timeLeft = data.time
    QuestionSeconds = data.time
    resetTimerMusic()
    question.innerHTML = `${data.question} <div class="es"> ${data.questionES || ''}</div>`
    words = data.question.split(" ")
    question.classList.remove('question-swoop')
    question.classList.add('hide')

    let html = `<ul class="${data.lock ? 'hidden' : ''} ${data.choices.length === 3 ? 'three' : ''}">`;
    data.choices.forEach((answer, i) => {
      const addTime = !!(answer.split(" ").length > 3)
      const [answerTop = '', answerBottom = ''] = answer.split("/")
      html += `
              <li data-choice="${answer.trim()}" data-time="${addTime}" class="hidden">
              <span>${answerTop.trim()}</span>
              <span>${answerBottom.trim()}</span>
              </li>`
    })
    html += '</ul>'
    answers.innerHTML = html

  }
}

function setTimer() {
  clearInterval(clockTimer)
  timer.innerHTML = timeLeft
  pauseTime = false
  socket.emit('pauseTime', pauseTime)
}



function startTimer() {

  question.classList.add('question-swoop')
  question.classList.remove('hide')

  let delay = Math.ceil(words.length / 3) * 1000
  const DELAY_BY = 1500
  const DELAY_BY_EXTRA = 1000
  const ul = answers.querySelector('ul')


  if (!ul.classList.contains('hidden')) {
    if (answers.querySelector('li:nth-child(1)')) {
      delay += DELAY_BY
      answer1Timer = setTimeout(() => {
        socket.emit('answerShown', 1)
        const li = answers.querySelector('li:nth-child(1)')
        if (li) li.classList.remove('hidden')
      }, delay)
      if (answers.querySelector('li:nth-child(1)').dataset.time == "true") {
        delay += DELAY_BY_EXTRA
      }
    }
    if (answers.querySelector('li:nth-child(2)')) {
      delay += DELAY_BY
      answer2Timer = setTimeout(() => {
        socket.emit('answerShown', 2)
        const li = answers.querySelector('li:nth-child(2)')
        if (li) li.classList.remove('hidden')
      }, delay)
      if (answers.querySelector('li:nth-child(2)').dataset.time == "true") {
        delay += DELAY_BY_EXTRA
      }
    }
    if (answers.querySelector('li:nth-child(3)')) {
      delay += DELAY_BY
      answer3Timer = setTimeout(() => {
        socket.emit('answerShown', 3)
        const li = answers.querySelector('li:nth-child(3)')
        if (li) li.classList.remove('hidden')
      }, delay)
      if (answers.querySelector('li:nth-child(3)').dataset.time == "true") {
        delay += DELAY_BY_EXTRA
      }
    }
    if (answers.querySelector('li:nth-child(4)')) {
      delay += DELAY_BY
      answer4Timer = setTimeout(() => {
        socket.emit('answerShown', 4)
        const li = answers.querySelector('li:nth-child(4)')
        if (li) li.classList.remove('hidden')
      }, delay)
      if (answers.querySelector('li:nth-child(4)').dataset.time == "true") {
        delay += DELAY_BY_EXTRA
      }
    }
  }

  delay += DELAY_BY
  questionReadyTimer = setTimeout(() => {
    socket.emit('questionReady')
    questionReady = true
    clockTimer = setInterval(countdown, 1000)
    playTimerMusic()
  }, delay)
}

function countdown() {
  if (timeLeft <= 0) {
    clearInterval(clockTimer)
    return
  }
  if (!pauseTime) {
    playTimerMusic()
    timeLeft--
    timer.innerHTML = timeLeft
  } else {
    pauseTimerMusic()
  }

}

function questionClose(show = true) {
  pauseTimerMusic()
  clearInterval(clockTimer)
  questionReady = false
  socket.emit('questionClose')
  info.classList.add('info-display')
  if (show)
    showCorrectAnswerTimer = setTimeout(showCorrectAnswer, 3000)
}

function showCorrectAnswer() {

  const choices = document.querySelectorAll('li[data-choice]')
  choices.forEach((input) => {
    if (input.dataset.choice.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      input.classList.add('correct')
    }
  })

  if (correctAnswer.length && chosenAnswer !== null && chosenAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
    info.innerHTML = `Correct`
    info.classList.add('correct')
    if (!pauseSoundFX) s_correct.play()
  } else {
    info.innerHTML = `Incorrect`
    info.classList.add('wrong')
    if (!pauseSoundFX) s_wrong.play()
  }
  socket.emit('unLockLogo')
}


function playTimerMusic() {
  if (pauseSoundFX) {
    pauseTimerMusic()
    return
  }
  stopTrack()
  if (QuestionSeconds == 10) {
    s_10sec.play()
  }
  if (QuestionSeconds == 30) {
    s_30sec.play()
  }
  if (QuestionSeconds == 60) {
    s_60sec.play()
  }
}

function pauseTimerMusic() {
  s_10sec.pause()
  s_30sec.pause()
  s_60sec.pause()
  playMusic()
}

function resetTimerMusic() {
  s_10sec.currentTime = 0
  s_30sec.currentTime = 0
  s_60sec.currentTime = 0
}

function setTimerVolume(vol) {
  s_10sec.volume = vol
  s_30sec.volume = vol
  s_60sec.volume = vol
}

setTimerVolume(0.1)




function stopTrack() {
  tracks[currentTrack].pause()
  showdownTrack.pause()
}

function playTrack() {
  if (pauseShowdownMusic) {
    showdownTrack.pause()
    tracks[currentTrack].play()
  } else {
    tracks[currentTrack].pause()
    showdownTrack.play()
  }
}

function playNextTrack() {
  stopTrack()
  tracks[currentTrack].currentTime = 0
  currentTrack = (currentTrack + 1) % allTracks
  playTrack()
}

function playNextIntroTrack() {
  const num = (currentIntroTrack + 1) % allIntroTracks
  setIntroTrack(num)
}

function setIntroTrack(num) {
  if (num >= 0 && num < allIntroTracks) {
    currentIntroTrack = num
    introTrack.forEach(track => {
      track.pause()
      track.currentTime = 0
    })
    introTrack[currentIntroTrack].play()
  }
}

function setMusicVolume(musicVol) {
  introTrack.forEach(track => {
    track.volume = musicVol
  })
  showdownTrack.volume = musicVol
  tracks.forEach((track) => {
    track.volume = musicVol
  })
}


function showScoresToggle(score) {

  $scoreBoard.toggleAttribute('hidden')
  const isWholeNumber = (num) => {
    return /^\d+$/.test(num)
  }
  let teamInfo = {'unanswered': 0, 1: [], 2: []}
  let html = '<header>Score Board</header>'
  Object.values(score).forEach( (data) => {
      if (isWholeNumber(data.team) && !teamInfo.hasOwnProperty(data.team)){
          teamInfo[data.team] = []
      }

      if (teamInfo.hasOwnProperty(data.team))
          teamInfo[data.team].push({correct:data.correct})
      else
          teamInfo['unanswered']++
  })

  html += '<div class="teams">'
  Object.keys(teamInfo).filter( key => key!== 'unanswered').forEach( (team) => {
      const correct = teamInfo[team].filter(data => data.correct).length
      const incorrect = teamInfo[team].filter(data => !data.correct).length
      html += `<div class="team">
        <div>Team ${team}</div>
        <div>Right</div>
        <div>Wrong</div>
        <div>${correct}</div>
        <div>${incorrect}</div>
      </div>`
  })
  html += '</div>'

  const unanswered = teamInfo['unanswered']
  const numCorrect = Object.values(score).filter(q => q.correct).length
  const numIncorrect = Object.values(score).filter(q => !q.correct).length

  html += `<div class="results">
    <div>Not Answered</div> <div>Total Right</div> <div>Total Wrong</div>
    <div>${unanswered}</div> <div> ${numCorrect}</div> <div> ${numIncorrect}</div>
  </div>`
  $scoreBoard.innerHTML = `<div>${html}</div>`

}

// window.addEventListener('DOMContentLoaded', ()=>{introTrack.play()})

