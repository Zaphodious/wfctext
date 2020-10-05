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

export function tileedge(tile,dir) {
    let height = tile.length
    let width = tile[0].length
    let tall = dir === 'right' || dir === 'left'
    let ret = []
    if (dir === 'right' || dir === 'left') {
        let centerx = Math.floor(width/2)
        for (let y of range(0,height)) {
            let modx = dirs_mapping[dir][0] + centerx
            ret.push(tile[y][modx])
        }
    } else if (dir === 'above') {
        ret = tile[0]
    } else if (dir === 'below') {
        ret = tile[tile.length-1]
    }
    return ret
}

// tileedge([['a','b','c'], ['d', 'e', 'f'], ['g', 'h', 'i']], 'right')
// tileedge([['a','b','c'], ['d', 'e', 'f'], ['g', 'h', 'i']], 'left')
// tileedge([['a','b','c'], ['d', 'e', 'f'], ['g', 'h', 'i']], 'above')
// tileedge([['a','b','c'], ['d', 'e', 'f'], ['g', 'h', 'i']], 'below')