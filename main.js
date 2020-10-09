import {make_simple_grid} from './build.js'
import {pull_tileset, expand_computed_map, parse_tileset_text, pull_examplemap} from './makerules.js'
import {range} from './util.js'

export default class MapMaker {
    constructor() {
        this.tilesets = {}
    }
    async add_from_example(name, exampleurl, tilewidth, tileheight) {
        let [mapping, rules] = await pull_examplemap(exampleurl, tilewidth, tileheight)
        this.tilesets[name] = {
            mapping, rules
        }
        return this
    }
    async add_tileset(name, tileseturl, tilewidth, tileheight, spacing, last_surrounds = false) {
        let [mapping, rules] = await pull_tileset(tileseturl, tilewidth, tileheight, spacing, last_surrounds)
        this.tilesets[name] = {
            mapping, rules
        }
        return this
    }
    async add_tileset_text(name, tilesettext, tilewidth, tileheight, spacing, last_surrounds = false) {
        let [mapping, rules] = await parse_tileset_text(tilesettext, tilewidth, tileheight, spacing, last_surrounds)
        this.tilesets[name] = {
            mapping, rules
        }
        return this
    }
    async generate(tileset_name, width, height) {
        let map = undefined
        while (!map) {
            try {
                map = this.__dogenerate(tileset_name, width, height)
            } catch {

            }
        }
        return map
    }

    async __dogenerate(tileset_name,width,height) {
            let ts = this.tilesets[tileset_name]
            let map = await make_simple_grid(ts.rules, width, height)
            let expanded = expand_computed_map(map, ts.mapping)
            return expanded
    }
}

async function testit() {
    let m = new MapMaker()
    for (let i of range(0,3)) {
        drr(m, i)
    }
    for (let i of range(0,4)) {
        biggy(m,i)
    }
}
async function drr(mapmaker, i) {
    let m = mapmaker
    await m.add_tileset(`dungeon${i+1}`,`./tileset${i+1}.txt`, 3, 3, 1, true)
    let map = await m.generate(`dungeon${i+1}`, 10, 15)
    let strmap = map.map(row=>row.join('')).join('\n')
    console.log(strmap)
    console.log(i)
    let elem = document.querySelector(`#example${i}`)
    elem.textContent = strmap
}
async function biggy(mapmaker, i) {
    try {
        let m = mapmaker
        await m.add_tileset(`big${i}`,`./giant${i+1}.txt`, 5, 5, 1)
        let map = await m.generate(`big${i}`, 10, 15)
        let strmap = map.map(row=>row.join('')).join('\n')
        console.log(strmap)
        let elem = document.querySelector(`#example${i+3}`)
        elem.textContent = strmap
    } catch (err) {
        console.log('doing biggy again', i, err)
        biggy(mapmaker, i)
    }
}

if (self.testtime) {
    console.log('testing this!')
    testit()
}