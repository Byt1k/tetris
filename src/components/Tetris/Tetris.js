import s from './Tetris.module.css'
import { useEffect, useRef, useState } from 'react'
import { getRandomInt } from '../../helpers/getRandomInt'
import { tetrominoColors, tetrominos } from '../../helpers/tetraminos'
import { rotateMatrix } from "../../helpers/rotateMatrix";

function Tetris() {
  const [bestScore, setBestScore] = useState(0)
  const [scorePoints, setScorePoints] = useState(0) // кол-во очков
  const [gameOver, setGameOver] = useState(false) // флаг конца игры

  let tetromino = null  // текущая фигура
  // const [tetromino, setTetromino] = useState(null)  // текущая фигура

  const [rAF, setRAF] = useState(null) // кадры анимации
  let count = 0 // счетчик

  const canvasRef = useRef(null)
  const canvas = canvasRef.current
  const [context, setContext] = useState(null)

  const grid = 32
  const tetrominoSequence = [] // Последовательность фигур
  const playField = [] // Игровое поле

  for (let row = -2; row < 20; row++) {
    playField[row] = []

    for (let col = 0; col < 10; col++) {
      playField[row][col] = 0
    }
  }

  const generateSequence = () => {
    const sequence = Object.keys(tetrominos)

    while (sequence.length) {
      const rand = getRandomInt(0, sequence.length - 1)
      const name = sequence.splice(rand, 1)[0]
      tetrominoSequence.push(name)
    }
  }

  const getNextTetromino = () => {
    if (tetrominoSequence.length === 0) {
      generateSequence()
    }

    const name = tetrominoSequence.pop()
    const matrix = tetrominos[name]

    const col = playField[0].length / 2 - Math.ceil(matrix[0].length / 2)

    // I начинает с 21 строки (смещение -1), а другие — со строки 22 (смещение -2)
    const row = name === 'I' ? -1 : -2

    return { name, matrix, row, col }
  }

  const isValidMove = (matrix, cellRow, cellCol) => {
    // Проверяем все строки и столбцы
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] && (
            // Если выходит за границы поля…
            cellCol + col < 0 ||
            cellCol + col >= playField[0].length ||
            cellRow + row >= playField.length ||
            // …или пересекается с другими фигурами
            playField[cellRow + row][cellCol + col])
        ) {
          // то возвращаем, что так нельзя
          return false
        }
      }
    }

    return true
  }

  const placeTetromino = () => {
    // обрабатываем все строки и столбцы в игровом поле
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {

          // если край фигуры после установки вылезает за границы поля, то игра закончилась
          if (tetromino.row + row < 0) {
            return setGameOver(true)
          }
          // если всё в порядке, то записываем в массив игрового поля нашу фигуру
          playField[tetromino.row + row][tetromino.col + col] = tetromino.name
        }
      }
    }

    // проверяем, чтобы заполненные ряды очистились снизу вверх
    for (let row = playField.length - 1; row >= 0; ) {
      // если ряд заполнен
      if (playField[row].every(cell => !!cell)) {

        // очищаем его и опускаем всё вниз на одну клетку
        for (let r = row; r >= 0; r--) {
          for (let c = 0; c < playField[r].length; c++) {
            playField[r][c] = playField[r-1][c]
          }
        }
        setScorePoints(prev => prev + 250)
      }
      else {
        // переходим к следующему ряду
        row--
      }
    }
    // получаем следующую фигуру
    tetromino = getNextTetromino()
  }

  useEffect(() => {
    if (!gameOver) return

    // прекращаем всю анимацию игры
    cancelAnimationFrame(rAF)
    // рисуем чёрный прямоугольник посередине поля
    context.fillStyle = 'black'
    context.globalAlpha = 0.75
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60)
    // пишем надпись белым моноширинным шрифтом по центру
    context.globalAlpha = 1
    context.fillStyle = 'white'
    context.font = '36px monospace'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2)

    // Если текущий счет превысил максимальный результат
    // Запишем его в лучший результат и локальное хранилище

    if (scorePoints > bestScore) {
      setBestScore(scorePoints)
      // todo сохранить в БД лучший счет
    }
  }, [gameOver])

  // Главный цикл игры
  const loop = () => {

    if (!context) return

    // начинаем анимацию
    setRAF(requestAnimationFrame(loop))
    // очищаем холст
    context.clearRect(0, 0, canvas.width, canvas.height)

    // рисуем игровое поле с учётом заполненных фигур
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        if (playField[row][col]) {
          const name = playField[row][col]
          context.fillStyle = tetrominoColors[name]

          // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
          context.fillRect(col * grid, row * grid, grid-1, grid-1);
        }
      }
    }

    // рисуем текущую фигуру
    if (tetromino) {
      if (scorePoints < 1000){
        // фигура сдвигается вниз каждые 35 кадров
        if (++count > 35) {
          tetromino.row++
          count = 0

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
            tetromino.row--
            placeTetromino()
          }
        }
      } else if (scorePoints >= 1000 && scorePoints < 2500) {
        if (++count > 30) {
          tetromino.row++
          count = 0;

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
            tetromino.row--
            placeTetromino()
          }
        }
      } else if ( scorePoints >= 2500) {
        if (++count > 20) {
          tetromino.row++
          count = 0

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
            tetromino.row--
            placeTetromino()
          }
        }
      } else {
        if (++count > 15) {
          tetromino.row++
          count = 0

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
            tetromino.row--
            placeTetromino()
          }
        }
      }

      // не забываем про цвет текущей фигуры
      context.fillStyle = tetrominoColors[tetromino.name]

      // отрисовываем её
      for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
          if (tetromino.matrix[row][col]) {

            // и снова рисуем на один пиксель меньше
            context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1)
          }
        }
      }
    }
  }

  const applyMoveTetromino = (tetromino, col) => {
    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col
    }
  }

  const moveTetrominoRight = (tetromino) => {
    const col = tetromino.col + 1
    applyMoveTetromino(tetromino, col)
  }

  const moveTetrominoLeft = (tetromino) => {
    const col = tetromino.col - 1
    applyMoveTetromino(tetromino, col)
  }

  const rotateTetromino = (tetromino) => {
    const matrix = rotateMatrix(tetromino.matrix)

    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix
    }
  }

  const accelerateTetraminoFall = () => {
    if (tetromino.row < 1) return

    while(isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
      tetromino.row += 1
    }
    placeTetromino()
  }

  const keyboardEventListener = (e) => {
    // если игра закончилась — сразу выходим
    if (gameOver) return

    // стрелки влево и вправо
    if (e.which === 37 || e.which === 39) {
      e.which === 37 ? moveTetrominoLeft(tetromino) : moveTetrominoRight(tetromino)
    }
    // стрелка вверх — поворот
    if (e.which === 38) {
      rotateTetromino(tetromino)
    }

    // стрелка вниз — ускорить падение
    if(e.which === 40) {
      accelerateTetraminoFall()
    }
  }

  useEffect(() => {
    if (!context) {
      setContext(canvas?.getContext('2d'))
    }

    tetromino = getNextTetromino()

    setRAF(requestAnimationFrame(loop))

    document.addEventListener('keydown', keyboardEventListener)

    return () => document.removeEventListener('keydown', keyboardEventListener)
  }, [context])

  // const [xDown, setXDown] = useState(null)
  // const [yDown, setYDown] = useState(null)

  const [xDown, setXDown] = useState(null)
  const [yDown, setYDown] = useState(null)

  const handleTouchStart = e => {
    setXDown(e.touches[0].clientX)
    setYDown(e.touches[0].clientY)
  }

  const handleTouchEnd = e => {

  }

  const handleTouchMove = e => {
    if (!xDown || !yDown) return

    const xUp = e.touches[0].clientX
    const yUp = e.touches[0].clientY

    const xDiff = xDown - xUp
    const yDiff = yDown - yUp

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if ( xDiff > 0 ) {
        console.log('left')
        moveTetrominoLeft(tetromino)
      } else {
        console.log('right')
        moveTetrominoRight(tetromino)
      }
    } else {
      if ( yDiff < 0 ) {
        accelerateTetraminoFall()
      }
    }
    /* reset values */
    setXDown(null)
    setYDown(null)
  }


  return (
      <>
        <div className="container">
          <div className={s.results}>
            <div className={s.results__item}>
              {scorePoints}
            </div>
            <div className={s.results__item}>
              <svg fill="#fff" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                <title>star-round</title>
                <path d="M0 16q0-3.232 1.28-6.208t3.392-5.12 5.12-3.392 6.208-1.28q3.264 0 6.24 1.28t5.088 3.392 3.392 5.12 1.28 6.208q0 3.264-1.28 6.208t-3.392 5.12-5.12 3.424-6.208 1.248-6.208-1.248-5.12-3.424-3.392-5.12-1.28-6.208zM4 16q0 3.264 1.6 6.048t4.384 4.352 6.016 1.6 6.016-1.6 4.384-4.352 1.6-6.048-1.6-6.016-4.384-4.352-6.016-1.632-6.016 1.632-4.384 4.352-1.6 6.016zM6.496 12.928l6.56-0.96 2.944-5.952 2.944 5.952 6.56 0.96-4.768 4.64 1.152 6.528-5.888-3.072-5.888 3.072 1.152-6.528z" />
              </svg>
              {bestScore}
            </div>
          </div>
          <div
              className={s.wrapper}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
          >
            <canvas ref={canvasRef} width="320" height="640" id="game"/>
          </div>
        </div>
      </>
  )
}

export default Tetris
