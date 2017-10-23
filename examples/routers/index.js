import Vue from 'vue'
import Router from 'vue-router'
import Button from './button'
import Menu from './menu'
import Icon from './icon'
import Input from './input'
import Rate from './rate'
import Card from './card'
import Grid from './grid'
import Radio from './radio'
import Switch from './switch'
import Transition from './transition'
import Select from './select'

Vue.use(Router)

let router = new Router({
  routes: [
    {
      path: '/button',
      component: Button
    },
    {
      path: '/menu',
      component: Menu
    },
    {
      path: '/icon',
      component: Icon
    },
    {
      path: '/input',
      component: Input
    },
    {
      path: '/rate',
      component: Rate
    },
    {
      path: '/card',
      component: Card
    },
    {
      path: '/grid',
      component: Grid
    },
    {
      path: '/radio',
      component: Radio
    },
    {
      path: '/switch',
      component: Switch
    },
    {
      path: '/transition',
      component: Transition
    },
    {
      path: '/select',
      component: Select
    }
  ]
})

export default router
