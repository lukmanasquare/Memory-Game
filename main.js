// Assigned back and blank images
const CARD_BACK_IMAGE = 'images/back.png'
const CARD_BLANK_IMAGE = 'images/blank.png'

// All 24 front images here
const CARD_FRONT_IMAGES = [
  'images/card_1.png',
  'images/card_2.png',
  'images/card_3.png',
  'images/card_4.png',
  'images/card_5.png',
  'images/card_6.png',
  'images/card_7.png',
  'images/card_8.png',
  'images/card_9.png',
  'images/card_10.png',
  'images/card_11.png',
  'images/card_12.png',
  'images/card_13.png',
  'images/card_14.png',
  'images/card_15.png',
  'images/card_16.png',
  'images/card_17.png',
  'images/card_18.png',
  'images/card_19.png',
  'images/card_20.png',
  'images/card_21.png',
  'images/card_22.png',
  'images/card_23.png',
  'images/card_24.png',
]

;(() => {
  // -------- DOM helpers
  const $ = (selector) => document.querySelector(selector)
  const on = (element, event, handler) =>
    element.addEventListener(event, handler)

  // -------- Local storage keys
  const STORAGE_PLAYER_KEY = 'myGame_player'
  const STORAGE_CARD_COUNT_KEY = 'myGame_numCards'
  const getHighScoreKey = (playerName) =>
    `mg_highScore_${playerName || 'guest'}`

  // -------- Game state
  let totalCards = 48 // default per spec
  let currentPlayer = ''
  let totalTurns = 0 // number of pair attempts
  let correctMatches = 0
  let matchedPairsCount = 0
  let isBoardLocked = false // block input during animations
  let firstCardSelected = null // { a,img,front }
  let secondCardSelected = null

  // -------- Tabs
  function initTabs() {
    const tabMap = {
      '#tabs_cards_link': '#tabs_cards',
      '#tabs_rules_link': '#tabs_rules',
      '#tabs_settings_link': '#tabs_settings',
    }
    Object.entries(tabMap).forEach(([tabLinkSelector, panelSelector]) => {
      on($(tabLinkSelector), 'click', () => {
        document
          .querySelectorAll('.tablinks')
          .forEach((btn) => btn.classList.remove('active'))
        $(tabLinkSelector).classList.add('active')

        document
          .querySelectorAll('.tabcontent')
          .forEach((panel) => panel.classList.add('hide'))
        $(panelSelector).classList.remove('hide')
      })
    })
  }

  // -- Preload images
  function preloadImages(imageSources) {
    imageSources.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }

  // -- Shuffle utility
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[randomIndex]] = [array[randomIndex], array[i]]
    }
    return array
  }

  // -------- Fade helpers
  function fadeTo(image, targetOpacity, durationMs, callback) {
    const fps = 60
    const steps = Math.max(1, Math.floor((durationMs / 1000) * fps))
    const startOpacity = parseFloat(getComputedStyle(image).opacity) || 1
    const opacityChange = (targetOpacity - startOpacity) / steps
    let step = 0

    const intervalId = setInterval(() => {
      step++
      const newOpacity = startOpacity + opacityChange * step
      image.style.opacity = String(newOpacity)
      if (step >= steps) {
        image.style.opacity = String(targetOpacity)
        clearInterval(intervalId)
        if (callback) callback()
      }
    }, Math.max(1, Math.floor(durationMs / steps)))
  }

  function flipImage(image, newSource, callback) {
    fadeTo(image, 0, 120, () => {
      image.src = newSource
      fadeTo(image, 1, 120, callback)
    })
  }

  // -------- Building the game deck
  function createShuffledDeck() {
    const numberOfPairs = totalCards / 2
    const selectedImages = shuffleArray([...CARD_FRONT_IMAGES]).slice(
      0,
      numberOfPairs
    )
    const fullDeck = shuffleArray([...selectedImages, ...selectedImages])
    return fullDeck
  }

  // -------- Render game board
  function renderGameBoard(deck) {
    const board = $('#cards')
    board.innerHTML = ''
    const cardsPerRow = 8

    deck.forEach((frontImage, index) => {
      if (index % cardsPerRow === 0) {
        const row = document.createElement('div')
        row.className = 'row'
        board.appendChild(row)
      }

      const row = board.lastElementChild
      const cardAnchor = document.createElement('a')
      cardAnchor.href = '#'
      cardAnchor.id = frontImage

      const cardImage = document.createElement('img')
      cardImage.src = CARD_BACK_IMAGE
      cardImage.alt = ''
      cardImage.style.opacity = '1'

      cardAnchor.appendChild(cardImage)
      row.appendChild(cardAnchor)

      on(cardAnchor, 'click', (event) =>
        handleCardClick(event, cardAnchor, cardImage, frontImage)
      )
    })

    const clearDiv = document.createElement('div')
    clearDiv.className = 'clear'
    board.appendChild(clearDiv)
    fixResponsiveGrid()
  }

  // -------- Click logic
  function handleCardClick(event, anchor, imageElement, frontImageSrc) {
    event.preventDefault()
    if (
      isBoardLocked ||
      anchor.dataset.matched === 'true' ||
      imageElement.src.includes(frontImageSrc)
    )
      return

    isBoardLocked = true
    flipImage(imageElement, frontImageSrc, () => {
      isBoardLocked = false
      if (!firstCardSelected) {
        firstCardSelected = {
          a: anchor,
          img: imageElement,
          front: frontImageSrc,
        }
      } else if (!secondCardSelected && anchor !== firstCardSelected.a) {
        secondCardSelected = {
          a: anchor,
          img: imageElement,
          front: frontImageSrc,
        }
        totalTurns++
        isBoardLocked = true
        setTimeout(checkIfCardsMatch, 1000)
      }
    })
  }

  function checkIfCardsMatch() {
    const isMatch = firstCardSelected.front === secondCardSelected.front
    if (isMatch) {
      correctMatches++
      matchedPairsCount++

      flipImage(firstCardSelected.img, CARD_BLANK_IMAGE, () => {
        firstCardSelected.a.dataset.matched = 'true'
      })
      flipImage(secondCardSelected.img, CARD_BLANK_IMAGE, () => {
        secondCardSelected.a.dataset.matched = 'true'
      })
    } else {
      flipImage(firstCardSelected.img, CARD_BACK_IMAGE)
      flipImage(secondCardSelected.img, CARD_BACK_IMAGE)
    }

    firstCardSelected = null
    secondCardSelected = null
    isBoardLocked = false

    if (matchedPairsCount === totalCards / 2) finishGame()
  }

  // -------- To end the game
  function finishGame() {
    const accuracy = totalTurns
      ? Math.round((correctMatches / totalTurns) * 100)
      : 0
    $('#correct').textContent = `Correct: ${accuracy}%`

    const scoreKey = getHighScoreKey(currentPlayer)
    const previousHighScore = parseInt(
      localStorage.getItem(scoreKey) || '0',
      10
    )
    const newHighScore = Math.max(previousHighScore, accuracy)
    localStorage.setItem(scoreKey, String(newHighScore))
    $('#high_score').textContent = `High score: ${newHighScore}%`
  }

  // -------- Settings
  function initSettingsPanel() {
    const savedPlayerName = localStorage.getItem(STORAGE_PLAYER_KEY) || ''
    const savedCardCount = parseInt(
      localStorage.getItem(STORAGE_CARD_COUNT_KEY) || '48',
      10
    )
    currentPlayer = savedPlayerName
    totalCards = [8, 16, 24, 32, 40, 48].includes(savedCardCount)
      ? savedCardCount
      : 48

    $('#player').textContent = currentPlayer
      ? `Player: ${currentPlayer}`
      : 'Player: '
    const bestScore = parseInt(
      localStorage.getItem(getHighScoreKey(currentPlayer)) || '0',
      10
    )
    $('#high_score').textContent = bestScore ? `High score: ${bestScore}%` : ''

    $('#player_name').value = currentPlayer
    $('#num_cards').value = String(totalCards)

    on($('#save_settings'), 'click', () => {
      const nameInput = $('#player_name').value.trim()
      const cardInput = parseInt($('#num_cards').value, 10) || 48
      localStorage.setItem(STORAGE_PLAYER_KEY, nameInput)
      localStorage.setItem(STORAGE_CARD_COUNT_KEY, String(cardInput))
      window.location.reload()
    })

    fixResponsiveGrid()
  }

  // -------- Start a New game
  function initNewGameLink() {
    on($('#new_game a'), 'click', (event) => {
      event.preventDefault()
      window.location.reload()
    })
    fixResponsiveGrid()
  }

  // -------- App init
  document.addEventListener('DOMContentLoaded', () => {
    initTabs()
    initSettingsPanel()
    initNewGameLink()

    preloadImages([CARD_BACK_IMAGE, CARD_BLANK_IMAGE, ...CARD_FRONT_IMAGES])

    const deck = createShuffledDeck()
    renderGameBoard(deck)
  })

  // ---------------- Responsive Grid Fix ----------------
  function fixResponsiveGrid() {
    const cardsContainer = document.getElementById('cards')
    if (!cardsContainer) return

    // Remove fixed inline styles
    cardsContainer.style.width = '100%'
    cardsContainer.style.height = 'auto'

    // Count cards currently displayed
    const totalCards = cardsContainer.querySelectorAll('img').length
    let columns

    if (window.innerWidth <= 768) {
      columns = 4 // lock to 4 columns on phones/tablets
    } else {
      columns = Math.ceil(Math.sqrt(totalCards)) // roughly square grid
    }

    // Apply grid styling dynamically
    cardsContainer.style.display = 'grid'
    cardsContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`
    cardsContainer.style.gridAutoFlow = 'row dense'
    cardsContainer.style.gap = '8px'
  }
})()
