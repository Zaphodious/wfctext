import {dirs, dirs_mapping, dir_opposites} from './directions.js'
import {range, chars} from './util.js'

export async function pull_tileset(tileseturl, tilewidth, tileheight, spacing, last_surrounds = false) {
    let text = await (await fetch(tileseturl)).text()
    let asgrid = destructure_map(text) // Converts the text to an array of arrays of individual characters.
    let inds = tileset_indices(asgrid[0].length, asgrid.length, tilewidth, tileheight, spacing) // Computes the indices of each symbol of each tile, respecting spacing
    let tiles = inds.map(tile=>tile.map(row=>row.map(([x,y])=>asgrid[y][x]))) // Seperates out each tile using the indices provided
    let [mapping, rules] = make_tile_rules(tiles, last_surrounds) // Creates rules for the builder to use, as well as a way to convert a built map from symbols back to tiles
    return [mapping, rules]
}

// Converts a built map into tiles
export function expand_computed_map(grid, symbols_to_tiles) {
    let st = Object.values(symbols_to_tiles)[0]
    let tilewidth = st.length
    let tileheight = st[0].length

    let newgrid = []
    for (let y of range(0,grid.length)) {
        let row = grid[y]
        let ymod = tileheight * y
        for (let i of range(0,tileheight)) {
            newgrid.push([])
        }
        for (let x of range(0,row.length)) {
            let [symb] = row[x]
            let tile = symbols_to_tiles[symb]
            for (let i of range(0,tileheight)) {
                newgrid[i+ymod] = newgrid[i+ymod].concat(tile[i])
            }
        }
    }
    return newgrid
}

// Complicated function that does two things: first, maps tiles to symbols. second, determines which tiles can be next to each other.
function make_tile_rules(tiles, last_surrounds = false) {
    let height = tiles[0].length
    let width = tiles[0][0].length
    let tiles_to_symbols = {}
    let symbols_to_tiles = {}
    let strings_to_tiles = {}
    let symbols_to_strings = {}
    let symbols_to_edges = {}
    let last_symbol = ' '
    for (let [c,s,t] of associate_tiles(tiles)) {
        tiles_to_symbols[s] = c
        symbols_to_tiles[c] = t
        strings_to_tiles[s] = t
        symbols_to_strings[c] = s
        symbols_to_edges[c] = edges_for_tile(t, true)
        last_symbol = c
    }
        // console.log(tiles_to_symbols, symbols_to_tiles, strings_to_tiles, symbols_to_strings)
        // console.log(symbols_to_edges)
    let rules = {}
    for (let [sym, edges] of Object.entries(symbols_to_edges)) {
        rules[sym] = {}
        for (let dir of dirs) {
            rules[sym][dir] = []
        }
        for (let [countersym, counteredges] of Object.entries(symbols_to_edges)) {
            for (let dir of dirs) {
                let counterdir = dir_opposites[dir]
                if (edges[dir] === counteredges[counterdir]) {
                    rules[sym][dir].push(countersym)
                }
            }
        }
        rules[sym].weight = weight_for_tile(rules[sym])
        rules[sym].frequency = Math.round((100*Math.random())/(tiles.length*Math.random())) 
    }
    if (last_surrounds) {
        rules[last_symbol].surrounds = true
    }
    return [symbols_to_tiles, rules]
}

// Used to compute the shannon entropy of a cell. For now, just a count of the number of possibilities that each tile can be next to on each side.
function weight_for_tile(tilerule) {
    let ret = 0
    for (let dir of dirs) {
        let a = tilerule[dir]
        ret += a.length
    }
    return ret
} 

function* associate_tiles(tiles) {
    let i = 0
    for (let tile of tiles) {
        let s = tile_to_string(tile)
        let c = chars[i]
        i++
        yield [c,s,tile]
    }
}


function tileset_indices(width, height, tilewidth = 3, tileheight = 3, spacing = 1) {
    let tileswide = Math.ceil(width/(tilewidth+spacing))
    let tileshigh = Math.ceil(height/(tileheight+spacing))
    let newgrid = []
    for (let nx of range(0,tileswide)) {
        for (let ny of range(0,tileshigh)) {
            let cornerx = (nx * tilewidth) + (spacing * nx)
            let cornery = (ny * tilewidth) + (spacing * ny)
            let tile = []
            for (let localy of range(0,tileheight)) {
                let tiley = localy + cornery
                if (tiley < height) {
                    let row = []
                    for (let localx of range(0,tilewidth)) {
                        let tilex = localx + cornerx
                        if (tiley < width) {
                            row.push([tilex, tiley])
                        }
                    }
                    tile.push(row)
                }
            }
            newgrid.push(tile)
        }
    }
    return newgrid
}

function destructure_map(map) {
    let rows = map.split('\n')
    let grid = rows.map(row=>row.split(''))
    return grid
}

function tile_to_string(tile) {
    let s = ""
    for (let row of tile) {
        for (let cell of row) {
            s+=cell
        }
        s+='\n'
    }
    return s
}

function edges_for_tile(tile, asstring = false) {
    let ret = {}
    for (let dir of dirs) {
        let edge = tileedge(tile, dir)
        ret[dir] = asstring ? edge.join('') : edge
    }
    return ret
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