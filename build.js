import {dirs, dirs_mapping, dir_opposites, is_oob} from './directions.js'
import * as util from './util.js'


export async function make_simple_grid(rules, width, height) {
    let surrounding = Object.entries(rules).filter(([k,v])=>v.surrounds)[0] // See if one of the options needs to fill the edges of the map
    let grid = make_grid(rules, width, height, surrounding)
    collapseat(grid, Math.floor(width/2),Math.floor(height/2), rules) // Collapse the cell at the center of the map. Not a random location for consistency in testing
    let homogenous = false
    let solved = false
    while (!solved && !homogenous) {
        grid = prop_collapse(grid, rules)
        let [cx, cy] = min_entropy_coords(grid, rules)
        collapseat(grid, cx, cy, rules)
        // If the grid is unsolvable (one of the cells contains no options), or if the grid is boring (contains mostly the same stuff), we redo it
        if (is_unsolvable(grid) || homogenous) { // The grid is unsolvable if one of the cells has no options. Some versions track changes and rollback- we're just starting over.
            console.log('unsolvable detected, redoing')
            grid = make_grid(rules, width, height, surrounding)
            collapseat(grid, 2, 2, rules) // For re-do's, we start close to the top left corner to maximize consistency.
        }
        await util.dolater() // This process will loop many times, and awaiting a zero-time timer keeps the browser responsive.
        solved = is_solved(grid)
        homogenous = is_homogenous(grid)
    }
    printgrid(grid)
    return grid

} 

function collapseat(grid, x, y, rules) {
    let cell = grid[y][x]
    let theway = pick_weighted(cell, rules)
    grid[y][x] = theway
}

function surround_with(grid, symbol) {
    let height = grid.length
    let width = grid[0].length
    let filledtop = []
    let filledbottom = []
    for (let i of util.range(0,width)) {
        filledtop.push([symbol])
        filledbottom.push([symbol])
    }
    grid[0] = filledtop
    grid[height-1] = filledbottom
    for (let y of util.range(0,height)) {
        let row = grid[y]
        row[0] = [symbol]
        row[width-1] = [symbol]
    }
    return grid
}

function prop_collapse(grid, rules) {
    let changes_made_this_round = false // We track if there are any changes to the grid this iteration, becase we want to keep propigating until there are no changes to make
    grid = mapgrid(grid, (cell,x,y) => {
        if (cell.length > 1) { // If a cell array is one element long, then it's collapsed. No use trying to propigate possibilities back to it.
            for (let dir of dirs) { // directions are left, right, above, and below
                let [newx,newy] = modcoords([x,y], dirs_mapping[dir]) // dirs_mapping has what to add to a cell's coords to get the cell in that direction. modcoords() does just that
                try {
                    let ncell = grid[newy][newx]
                    ncell[0] // This throws if the cell does not exist, which might happen if the coords are for beyond the level boundary.
                    let opposite = dir_opposites[dir]
                    let permissible = []
                    for (let possible_in_cell of ncell) { // For each possibility in the adjascent cells, collect what can be next to them.
                        let allowable = rules[possible_in_cell][opposite]
                        permissible = permissible.concat(allowable)
                    }
                    let oldlength = cell.length
                    cell = cell.filter(n=>{ // Remove possibilities that aren't in the allowable list
                        let has = permissible.includes(n)
                        return has
                    })
                    if (oldlength != cell.length) {
                        changes_made_this_round = true
                    }
                } catch (err) { // We don't care about the error, really. Just that its caught.
                    // console.error(err)
                }
            }
        }
        return cell // This is an anon function, remember
    })
    if (changes_made_this_round) {
        return prop_collapse(grid, rules) // Recursive and *not* using a while loop, as it was easier to keep things straight while writing this section. The debugger became my friend here. This could be refactored to avoid a potential stack overflow.
    } else {
        return grid
    }
}

function modcoords(originals,mods) {
    originals[0] = originals[0] + mods[0]
    originals[1] = originals[1] + mods[1]
    return originals
}

function make_grid(rules, width, height, surrounding) {
    let fulloptions = Object.keys(rules)
    let newgrid = []
    for (let y=0; y < height; y++) {
        let newrow = []
        for (let x=0; x < width; x++) {
            newrow.push([...fulloptions])
        }
        newgrid.push(newrow)
    }
    if (surrounding) {
        newgrid = surround_with(newgrid, surrounding[0])
    }
    return newgrid
}

// Utility function to make the results of a simple example easier to see in the terminal.
function printgrid(grid, print = true) {
    let rows = mapgrid(grid, (cell)=>cell.map(n=>n))
    let solved = is_solved(grid)
    if (solved) {
        let newgrid = grid.map(row => row.join('')).join('\n')
    } else {
        let maxwidth = 0
        for (let [cell] of loopgrid(rows)) {
            maxwidth = Math.max(maxwidth, cell.length)
        }
        for (let [cell] of loopgrid(rows)) {
            while (cell.length < maxwidth) {
                cell.push('‏‏‎_‎')
            }

        }
        let newgrid = rows.map(row=>row.map(cell=>cell.join('')).join('|')).join('\n'+makeline((grid[0].length*maxwidth)+grid.length)+'\n')
        if (print) {
            console.log(newgrid)
        }
        return newgrid
    }
}

function makeline(width) {
    let c = []
    while (c.length < width) {
        c.push('-')
    }
    return c.join('')
}


function* loopgrid(grid) {
    for (let [y, row] of grid.entries()) {
        for (let [x, cell] of row.entries()) {
            yield [cell,x,y,row]
        }
    }
}

function mapgrid(grid,func) {
    return grid.map((row,y)=>row.map((cell,x)=>func(cell,x,y,row)))
}

// This + min_entropy_coords determine which cell is collapsed each iteration. 
// Pulled almost verbatem from Robert Heaton's code. https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/
function shannon_entropy(grid, x, y, rules, cell) {
    let sum_of_weights = 0
    let sum_of_weight_log_weights = 0
    cell = cell || grid[y][x]
    if (cell[1] === undefined) {
        return Infinity
    }
    for (let opt of cell) {
        let weight = rules[opt]['weight']
        sum_of_weights += weight
        sum_of_weight_log_weights += weight * Math.log(weight)
    }
    return Math.log(sum_of_weights) - (sum_of_weight_log_weights / sum_of_weights)

}

function min_entropy_coords(grid, rules){
    let lowestx = 0
    let lowesty = 0
    let lowestent = null

    grid.forEach((row,y) => {
        row.forEach((_,x) => {
            let entropy = shannon_entropy(grid,x,y,rules)
            if ((lowestent===null || entropy < lowestent)) {
                entropy = entropy + Math.random()
                lowestent = entropy
                lowestx = x
                lowesty = y
            }
        })
    })
    return [lowestx, lowesty]
}

function is_solved(grid) {
    for (let [cell] of loopgrid(grid)) {
        if (cell[1] != undefined) {
            return false
        }
    }
    return true
}

function is_unsolvable(grid) {
    for (let [cell] of loopgrid(grid)) {
        if (cell[0] === undefined) {
            return true
        }
    }
    return false
}

function pick_weighted(options, rules) { // When determining which option to pick when collapsing a cell, we want _some_ control over how often different elements show up. 
    let highest = rules[options[options.length-1]].frequency
    let roll = Math.random() * highest 
    for (let elem of options) {
        let freq = rules[elem].frequency
        if (freq >= roll) {
            return [elem]
        }
    }
    return [options[options.length-1]]
}

function is_homogenous(grid) {
    let accum = []
    for (let row of grid) {
        for (let cell of row) {
            accum.push(cell[0])
        }
    }
    let setti = new Set(accum)
    return setti.size < 6
}