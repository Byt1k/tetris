import React, { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Tetris from './components/Tetris/Tetris'
import Home from './components/Home/Home'

const App = () => {
  const tgRef = useRef(window.Telegram.WebApp)

  useEffect(() => {
    tgRef.current.ready()
    tgRef.current.expand()
    tgRef.current.disableVerticalSwipes()
    tgRef.current.isClosingConfirmationEnabled = true
    tgRef.current.isVerticalSwipesEnabled = false
    alert(`Bot API version: ${tgRef.current.version}`)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path='/game' element={<Tetris />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App