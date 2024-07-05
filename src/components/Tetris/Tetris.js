import s from './Tetris.module.css'
import { useEffect, useRef, useState } from 'react'
import { getRandomInt } from '../../helpers/getRandomInt'
import { tetrominoColors, tetrominos } from '../../helpers/tetraminos'
import { rotateMatrix } from "../../helpers/rotateMatrix";

function Tetris() {
  const [bestScore, setBestScore] = useState(0)
  const [scorePoints, setScorePoints] = useState(0) // кол-во очков
  const [gameOver, setGameOver] = useState(false) // флаг конца игры

  const tetrominoRef = useRef() // текущая фигура
  // const [tetromino, setTetromino] = useState(null)  // текущая фигура

  const rafRef = useRef() // кадры анимации
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
    for (let row = 0; row < tetrominoRef.current.matrix.length; row++) {
      for (let col = 0; col < tetrominoRef.current.matrix[row].length; col++) {
        if (tetrominoRef.current.matrix[row][col]) {

          // если край фигуры после установки вылезает за границы поля, то игра закончилась
          if (tetrominoRef.current.row + row < 0) {
            return setGameOver(true)
          }
          // если всё в порядке, то записываем в массив игрового поля нашу фигуру
          playField[tetrominoRef.current.row + row][tetrominoRef.current.col + col] = tetrominoRef.current.name
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
    tetrominoRef.current = getNextTetromino()
  }

  useEffect(() => {
    if (!gameOver) return

    // прекращаем всю анимацию игры
    cancelAnimationFrame(rafRef.current)
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
    rafRef.current = requestAnimationFrame(loop)
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
    if (tetrominoRef.current) {
      if (scorePoints < 1000){
        // фигура сдвигается вниз каждые 35 кадров
        if (++count > 35) {
          tetrominoRef.current.row++
          count = 0

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetrominoRef.current.matrix, tetrominoRef.current.row, tetrominoRef.current.col)) {
            tetrominoRef.current.row--
            placeTetromino()
          }
        }
      } else if (scorePoints >= 1000 && scorePoints < 2500) {
        if (++count > 30) {
          tetrominoRef.current.row++
          count = 0;

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetrominoRef.current.matrix, tetrominoRef.current.row, tetrominoRef.current.col)) {
            tetrominoRef.current.row--
            placeTetromino()
          }
        }
      } else if ( scorePoints >= 2500) {
        if (++count > 20) {
          tetrominoRef.current.row++
          count = 0

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetrominoRef.current.matrix, tetrominoRef.current.row, tetrominoRef.current.col)) {
            tetrominoRef.current.row--
            placeTetromino()
          }
        }
      } else {
        if (++count > 15) {
          tetrominoRef.current.row++
          count = 0

          // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
          if (!isValidMove(tetrominoRef.current.matrix, tetrominoRef.current.row, tetrominoRef.current.col)) {
            tetrominoRef.current.row--
            placeTetromino()
          }
        }
      }

      // не забываем про цвет текущей фигуры
      context.fillStyle = tetrominoColors[tetrominoRef.current.name]

      // отрисовываем её
      for (let row = 0; row < tetrominoRef.current.matrix.length; row++) {
        for (let col = 0; col < tetrominoRef.current.matrix[row].length; col++) {
          if (tetrominoRef.current.matrix[row][col]) {

            // и снова рисуем на один пиксель меньше
            context.fillRect((tetrominoRef.current.col + col) * grid, (tetrominoRef.current.row + row) * grid, grid-1, grid-1)
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

  const moveTetrominoRight = tetromino => {
    const col = tetromino.col + 1
    applyMoveTetromino(tetromino, col)
  }

  const moveTetrominoLeft = tetromino => {
    const col = tetromino.col - 1
    applyMoveTetromino(tetromino, col)
  }

  const rotateTetromino = tetromino => {
    const matrix = rotateMatrix(tetromino.matrix)

    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix
    }
  }

  const accelerateTetraminoFall = tetromino => {
    if (tetromino.row < 0) return

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
      e.which === 37 ? moveTetrominoLeft(tetrominoRef.current) : moveTetrominoRight(tetrominoRef.current)
    }
    // стрелка вверх — поворот
    if (e.which === 38) {
      rotateTetromino(tetrominoRef.current)
    }

    // стрелка вниз — ускорить падение
    if (e.which === 40) {
      accelerateTetraminoFall(tetrominoRef.current)
    }
  }

  const xTouchStartRef = useRef(null)
  const yTouchStartRef = useRef(null)

  const handleTouchStart = e => {
    xTouchStartRef.current = e.touches[0].clientX
    yTouchStartRef.current = e.touches[0].clientY
  }

  const handleTouchEnd = e => {
    const xTouchEnd = e.changedTouches[0].clientX
    if (xTouchEnd === xTouchStartRef.current) {
      rotateTetromino(tetrominoRef.current)
    }
  }

  const handleTouchMove = e => {
    if (!xTouchStartRef.current || !yTouchStartRef.current) return

    const xUp = e.touches[0].clientX
    const yUp = e.touches[0].clientY

    const xDiff = xTouchStartRef.current - xUp
    const yDiff = yTouchStartRef.current - yUp

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if ( xDiff > 0 ) {
        moveTetrominoLeft(tetrominoRef.current)
      } else {
        moveTetrominoRight(tetrominoRef.current)
      }
    } else {
      if ( yDiff < 100 ) {
        accelerateTetraminoFall(tetrominoRef.current)
      }
    }

    xTouchStartRef.current = null
    yTouchStartRef.current = null
  }

  const reset = () => {
    window.location.reload()
  }

  useEffect(() => {
    if (!context) {
      setContext(canvas?.getContext('2d'))
    }

    tetrominoRef.current = getNextTetromino()

    document.addEventListener('keydown', keyboardEventListener)

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('keydown', keyboardEventListener)
    }
  }, [context])


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
              onTouchEnd={handleTouchEnd}
          >
            <canvas ref={canvasRef} width="320" height="640" id="game"/>
          </div>
          {gameOver && <button onClick={() => reset()} className={s.btn}>Retry</button>}
        </div>
      </>
  )
}

export default Tetris
