import {range} from './util.js'

export let dirs_mapping = {
    right: [1,0],
    left: [-1,0],
    above: [0,-1],
    below: [0,1],
}

export let dir_opposites = {
    right: 'left',
    left: 'right',
    above: 'below',
    below: 'above'
}

export let dirs = ['right', 'left', 'above', 'below']

export function is_oob(grid, x, y) {
    return y >= grid.length || y < 0 || x >= grid[0].length || x < 0
}