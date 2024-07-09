import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Tetris from './components/Tetris/Tetris'
import Home from './components/Home/Home'

const App = () => {
  const tg = window.Telegram.WebApp

  useEffect(() => {
    tg.ready()
    tg.expand()
    tg.disableVerticalSwipes()
    tg.isClosingConfirmationEnabled = true
    alert(tg.version)
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