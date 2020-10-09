import {dirs, dirs_mapping, dir_opposites, tileedge} from './directions.js'
import {range} from './util.js'


export function parsemap(map) {
    let grid = destructure_map(map)
}

export async function pull_examplemap(examplemapurl, tilewidth, tileheight) {
    let text = await (await fetch(examplemapurl)).text()
    let asgrid = destructure_map(text)
    let inds = examplemap_indices(asgrid[0].length, asgrid.length, tilewidth, tileheight)
    let tiles = inds.map(tile=>tile.map(row=>row.map(([x,y])=>asgrid[y][x])))
    let stringers = tiles.map(tile=>tile.map(row=>row.join('')).join('\n'))
    for (let s of stringers) {
        console.log(s)
    }
    console.log(tiles.length)
    let [mapping, rules] = make_tile_rules(tiles)
    console.log(Object.keys(rules).length)
    return [mapping, rules]
}

export async function pull_tileset(tileseturl, tilewidth, tileheight, spacing, last_surrounds = false) {
    let text = await (await fetch(tileseturl)).text()
    return parse_tileset_text(text, tilewidth, tileheight, spacing, last_surrounds)
}

export async function parse_tileset_text(text, tilewidth, tileheight, spacing, last_surrounds = false) {
    let asgrid = destructure_map(text)
    let inds = tileset_indices(asgrid[0].length, asgrid.length, tilewidth, tileheight, spacing)
    // for (let ind of inds) {
    //     console.log(ind.map(c=>c.join('|')).join('\n'))
    // }
    let tiles = inds.map(tile=>tile.map(row=>row.map(([x,y])=>asgrid[y][x])))
    let [mapping, rules] = make_tile_rules(tiles, last_surrounds)
    return [mapping, rules]
}

function rotate_tile_90(tile) {
    let newcell = []
    for (let x of range(0, tile[0].length)) {
        let row = []
        for (let y of range(0, tile.length)) {
            row.push(tile[y][x])
        }
        newcell.push(row)
    }
    return newcell
}

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

function make_tile_rules(tiles, last_surrounds = false) {
    let height = tiles[0].length
    let width = tiles[0][0].length
    let tiles_to_symbols = {}
    let symbols_to_tiles = {}
    let strings_to_tiles = {}
    let symbols_to_strings = {}
    let symbols_to_edges = {}
    let strings_to_symbols = {}
    let symbols_to_repeated = {}
    let last_symbol = ' '
    let already = new Set([])
    for (let [c,s,t] of associate_tiles(tiles)) {
        if (already.has(s)) {
            let sym = tiles_to_symbols[s]
            symbols_to_repeated[sym]++
            last_symbol = sym
        } else {
            tiles_to_symbols[s] = c
            symbols_to_tiles[c] = t
            strings_to_tiles[s] = t
            symbols_to_strings[c] = s
            symbols_to_edges[c] = edges_for_tile(t, true)
            symbols_to_repeated[c] = 1
            last_symbol = c
            already.add(s)
        }
    }
        // console.log(tiles_to_symbols, symbols_to_tiles, strings_to_tiles, symbols_to_strings)
        // console.log(symbols_to_edges)
    console.log(symbols_to_repeated)
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
        rules[sym].frequency = (Object.keys(symbols_to_edges).length / symbols_to_repeated[sym]) + Math.random()
    }
    if (last_surrounds) {
        rules[last_symbol].surrounds = true
    }
    return [symbols_to_tiles, rules]
}

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
        let c = i//chars[i]
        i++
        yield [c,s,tile]
    }
}

function examplemap_indices(width, height, tilewidth=3, tileheight=3) {
    let tilelist = []
    for (let cornery of range(0,height-tileheight)) {
        for (let cornerx of range(0,width-tilewidth)) {
            let cell = []
            for (let localy of range(0, tileheight)) {
                let cellrow = []
                for (let localx of range(0, tilewidth)) {
                    cellrow.push([cornerx+localx, cornery+localy])
                }
                cell.push(cellrow)
            }
            tilelist.push(cell)
        }
    }
    return tilelist
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
    grid = grid.filter(n=>n.length != 0)
    return grid
}

function into_tiles(grid) {

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