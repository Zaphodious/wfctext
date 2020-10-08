import MapMaker from '../main.js'
import {range} from '../util.js'

async function dotest(params) {
    console.log(params.tileset)
    console.log(params)
    let othermap = await (await fetch('../tileset1.txt')).text()
    console.log('maps similar?', othermap === params.tileset)
    let mm = new MapMaker()
    await mm.add_tileset_text('example1', params.tileset, params.tilewidth, params.tileheight, params.tilemargin, params.lastsurrounds)
    // await mm.add_tileset('example1', '../tileset1.txt', 3, 3, 1, true)
    params.examplelist.textContent = ""
    for (let _ of range(0,params.examplecount)) {
        let li = document.createElement('li')
        params.examplelist.appendChild(li)
        make_map(mm, li, params.mapwidth, params.mapheight)
    }

}

async function make_map(mapmaker, li, w, h) {
    let map = await mapmaker.generate('example1', h, w)
    let strmap = map.map(row=>row.join('')).join('\n')
    li.textContent = strmap
}

function setup() {
    let reader = new FileReader()
    let counter = document.querySelector("#examplecount")
    let tilewidthinput = document.querySelector("#tilewidth")
    let tileheightinput = document.querySelector("#tileheight")
    let tilemargininput = document.querySelector("#tilemargin")
    let mapwidthinput = document.querySelector("#mapwidth")
    let mapheightinput = document.querySelector("#mapheight")
    // let textarea = document.querySelector("#tilesetinput")
    let fileinput = document.querySelector("#tilesetinput")
    let gobutton = document.querySelector("#gobutton")
    let clearbutton = document.querySelector("#clearbutton")
    let lastsurroundsinput = document.querySelector("#lastsurrounds")
    let examplelist = document.querySelector("#examplelist")
    clearbutton.onclick = ()=>textarea.value=""
    async function gettileset() {
        let file = fileinput.files[0]
        reader.readAsText(file)
    }
    gobutton.onclick = async ()=>{
        let file = fileinput.files[0]
        reader.readAsText(file)
        reader.onload = (e) =>
        dotest({
        tileset: reader.result,
        tilewidth: parseInt(tilewidthinput.value),
        tileheight: parseInt(tileheightinput.value),
        tilemargin: parseInt(tilemargininput.value),
        mapwidth: parseInt(mapwidthinput.value),
        mapheight: parseInt(mapheightinput.value),
        examplecount: parseInt(counter.value),
        lastsurrounds: lastsurroundsinput.checked,
        examplelist
            })
    }
}

setup()