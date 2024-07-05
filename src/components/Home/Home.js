import React from 'react'
import logo from '../../assets/logo.png'
import s from './Home.module.css'
import { NavLink } from 'react-router-dom'

const Home = () => {
  return (
      <div className={'container ' + s.container}>
        <img src={logo} className={s.logo} alt="tetris" />
        <h1>Hello, {`${'{username}'}`}</h1>
        <p className={s.text}>Tetris is a puzzle video game created in 1985 by Alexey Pajitnov, a Soviet software engineer.</p>
        <NavLink to='/game' className={s.btn}>Start Game</NavLink>
        <p className={s.credits}>Spizheno by the best developers :)</p>
      </div>
  )
}

export default Home