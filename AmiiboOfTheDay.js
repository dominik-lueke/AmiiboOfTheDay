// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: star;
// ------------------------------------------
//              AMIIBO OF THE DAY
// ------------------------------------------
// 
// THIS WIDGET DISPLAYS A RANDOM AMIIBO FOR
// EVERY DAY. IT USES POKEAPI.CO TO FETCH AMIIBO
// 
// FEATURES
// - NAME
// - IMAGE
// - TYPES
// - HEIGHT and WEIGHT
// - BACKGROUND COLOR BASED ON TYPE
// - ENGLISH LANGUAGE
// - LINKS TO BULBAPEDIA/POKEWIKI WHEN DISPLAYED 
//   IN APP
// 
// USAGE:
// - BEST SET "WHEN INTERACTING" TO "RUN SCRIPT" 
// - PARAMETER: 
//   [MAX_ID[;UPDATE_INTERVAL]]
//
//   - MAX_ID (OPTIONAL)
//     SET MAXIMUM ID OF AMIIBO TO
//     CHOOSE FROM. 
//
//     USE VALUE "#<NAME>" TO PERMANENTLY DISPLAY
//     YOUR FAVOURITE AMIIBO WITH THE NAME.
//
//   - UPDATE_INTERVAL (OPTIONAL)
//     SET THE UPDATE INTERVAL IN HOURS [1-24]. 
//     DEFAULT IS 24.
//
//   - EXAMPLES
//     151   -> DISPLAY A NEW RANDOM AMIIBO FROM
//              THE FIRST 151 EVERY DAY
//     151;8 -> DISPLAY A NEW RANDOM AMIIBO FROM
//              THE FIRST 151 EVERY 8 HOURS
//     #Mario-> DISPLAY MARIO PERMANENTLY
//     ;1    -> DISPLAY A NEW RANDOM AMIIBO 
//              EVERY HOUR
//
// PLEASE NOTE
// - THE SCRIPT CACHES THE AMIIBO DATA AND 
//   IMAGES IN YOUR ICLOUD NEXT TO THIS SCRIPT
// 
// ------------------------------------------

// amiiboId;updateInterval by parameter
const param = args.widgetParameter
const paramArray = param ? param.split(";") : [""]
const amiiboId = paramArray[0]
const updateInterval = paramArray.length == 2 && Number.isInteger(parseInt(paramArray[1])) && parseInt(paramArray[1]) > 0 ? parseInt(paramArray[1]) : 24

// language
const isGerman = Device.locale() == "de_DE"
const language = isGerman ? "de" : "en"

// global functions + values for update interval
const getStartOfCurrentInterval = (interval) => (Math.floor(Date.now() / interval) * interval) + (new Date().getTimezoneOffset()*60*1000)
const oneHourInMillis = (60 * 60 * 1000)
const updateIntervalInMillis = (updateInterval * oneHourInMillis)
const currentIntervalStartInMillis = getStartOfCurrentInterval(updateIntervalInMillis)
const currentInterval = (Math.floor(new Date().getHours() / updateInterval) * updateInterval)



class AmiiboOfTheDayWidget{
// 
// The Widget
// 

  constructor(){
    // init data service
    this.amiiboDataService = new AmiiboDataService()

    // init widget
    this.widget = new ListWidget()
    this.widget.setPadding( 0, 0, 0, 0 )
    this.widget.refreshAfterDate = new Date (currentIntervalStartInMillis + oneHourInMillis) // only update once an hour

    // widget + font size 
    this.widgetHeight = 338
    this.widgetWidth = 338
    this.largeWidget = config.runsInApp || config.runsWithSiri || config.widgetFamily == "large"
    this.mediumWidget = config.widgetFamily == "medium"
    this.imageScaleFactor =  this.largeWidget ? 0.75 : this.mediumWidget ? 0.3 : 0.3
    this.titleFontSize = this.largeWidget ? 18 : 11
    this.infoFontSize = this.largeWidget ? 14: 10
    this.imagePadding = this.largeWidget ? 12 : 6
    this.weblinkFontSize = 10

  }

  async initData(defaultAmiiboId) {
    // always keep the data of the default amiibo in the cache
    let data = await this.amiiboDataService.initFullData()
    let defaultData = this.amiiboDataService.getData(defaultAmiiboId)
    this.defaultImage = await this.amiiboDataService.getImage(defaultData.id, defaultData.image)
    // get maxAmiiboId
    let maxAmiiboId = this.amiiboDataService.getDataSize() - 1
    // init selector
    this.amiiboSelector = new AmiiboSelector(maxAmiiboId)
  }

  async createWidget(paramId) {
    // get the id of the amiibo of today
    let id = this.amiiboSelector.getAmiiboIdOfToday(paramId)
    // get the data and image of the amiibo
    let data = await this.amiiboDataService.getData(id)
    
    // get image or no data 
    if ( data ) {
      let image = await this.amiiboDataService.getImage(data.id, data.image)
      if ( image ) {
        this.fillAmiiboWidget(data,image)
        return this.widget
      }
    }
    this.fillErrorWidget()
    return this.widget
  }

  fillErrorWidget(){
    this.addTitle(`Oh no! No Amiibo was found.`)
    if (this.defaultImage instanceof Image){
      this.addImage(this.defaultImage)
    } else {
      this.widget.addSpacer(18)
    }
    this.addInfo(`Something went wrong.\nPlease try again later.`)
    this.widget.backgroundGradient = this.getBackgroundForSeries("error")
  }

  fillAmiiboWidget(data,image){
    // title
    const wTitle = this.addTitle(data.name)
    // image
    const wImage = this.addImage(image)
    // types
    const gameCharacterInfoText = `${ data.character } • ${ data.gameSeries }`
    // dimensions
    const amiiboSeriesInfoText = `${ data.amiiboSeries }`
    // info
    const infoSeparatorText = this.largeWidget || this.mediumWidget ? " • " : "\n"
    const wInfo = this.addInfo(gameCharacterInfoText + infoSeparatorText + amiiboSeriesInfoText)
    // weblink
    // if (config.runsInApp) {
    //   this.addWebLink("https://ecosia.org", [wTitle, wImage, wInfo])
    // }
    // background
    this.widget.backgroundGradient = this.getBackgroundForSeries(data.amiiboSeries)
  }

  addTitle(str){
    const wTitle = this.widget.addText(str)
    wTitle.textColor = new Color("#131313")
    wTitle.font = Font.boldSystemFont(this.titleFontSize)
    wTitle.centerAlignText()
    return wTitle
  }

  addImage(image){
    this.widget.addSpacer(this.imagePadding)
    const wSprite = this.widget.addImage( image )
    wSprite.imageSize = new Size(this.widgetWidth * this.imageScaleFactor, this.widgetHeight * this.imageScaleFactor)
    wSprite.centerAlignImage()
    this.widget.addSpacer(this.imagePadding)
    return wSprite
  }

  addInfo(str){
    const wInfo = this.widget.addText(str)
    wInfo.textColor = new Color("#383838")
    wInfo.font = Font.lightRoundedSystemFont(this.infoFontSize)
    wInfo.centerAlignText()
    return wInfo
  }

  addWebLink(amiiboName, elementsToLink){
    // link hint
    const wLinkHint= this.widget.addText(isGerman ? "Online suchen" : "Search online")
    wLinkHint.textColor = new Color("#383838")
    wLinkHint.font = Font.lightRoundedSystemFont(this.weblinkFontSize)
    wLinkHint.centerAlignText()
    // add links
    const link = `https://ecosia.com`
    elementsToLink.forEach( e => e.url = link)
    wLinkHint.url = link
  }

  getBackgroundForSeries(type){
    const typeColorMap = {
      "Legend Of Zelda": "#c7fc89",
      "Super Smash Bros.": "#a0a0a1",
      "Super Mario Bros.": "#e95757",
      "Pikmin": "#c49a88",
      "Fire Emblem": "#da6e71",
      "Metroid": "#76adc0",
      "Splatoon": "#989da0",
      "Kirby": "#64aef7",
      "Animal Crossing": "#92e7c6",
      "Shovel Knight": "#98c7d9",
      "8-bit Mario": "#4eb887",
      "Yoshi's Woolly World": "#add58f",
      "Mega Man": "#e95757",
      "Error" : "#ffffff"
    }
    let baseColorHex = typeColorMap.hasOwnProperty(type) ? typeColorMap[type] : "#EEEEEE"
    let startColor = new Color(this.lightenDarkenColor(baseColorHex, 40))
    let endColor = new Color(this.lightenDarkenColor(baseColorHex, 20))
    let gradient = new LinearGradient()
    gradient.colors = [startColor, endColor]
    gradient.locations = [0.0, 1]
    return gradient
  }

  lightenDarkenColor(col, amt) {
    col = col.replace(/^#/, '')
    if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]
    let [r, g, b] = col.match(/.{2}/g);
    ([r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt])
    r = Math.max(Math.min(255, r), 0).toString(16)
    g = Math.max(Math.min(255, g), 0).toString(16)
    b = Math.max(Math.min(255, b), 0).toString(16)
    const rr = (r.length < 2 ? '0' : '') + r
    const gg = (g.length < 2 ? '0' : '') + g
    const bb = (b.length < 2 ? '0' : '') + b
    return `#${rr}${gg}${bb}`
  }

}

class AmiiboSelector {
// 
// Determine Amiibo to display based on 
// Parameter, Update Intervals, and current time
// 
  constructor(maxAmiiboId){
    this.randomDataCache = new RandomDataCache()
    this.maxAmiiboId = maxAmiiboId
    this.singleAmiiboIdPrefix = "#"
  }

  getAmiiboIdOfToday(paramId){
    // directly selected id from parameter
    if (paramId.startsWith(this.singleAmiiboIdPrefix)) {
      let amiiboId = paramId.slice(1)
      return amiiboId
    }
    // parse param as integer
    let amiiboId = parseInt(paramId)
    amiiboId = Number.isNaN(amiiboId)? this.maxAmiiboId : amiiboId
    // get random seed based on today
    const oneday = (24 * 60 * 60 * 1000)
    const todayInDays = Math.ceil(getStartOfCurrentInterval(oneday) / oneday)
    let randomSeed = this.randomDataCache.getRandomSeed(todayInDays)
    this.randomDataCache.saveRandomSeed(randomSeed)
    let random = randomSeed[todayInDays][currentInterval]
    // upper bound is given
    if (amiiboId > 0 && amiiboId <= this.maxAmiiboId) {
      return Math.ceil( random * amiiboId )
    }
    // return fully random as fallback
    return Math.ceil( random * this.maxAmiiboId )
  }
}

class AmiiboDataService {
//
// Data Service to fetch Amiibo from Cache or Api
//  
  constructor(){
    this.amiiboApi = new AmiiboApi()
    this.amiiboDataCache = new AmiiboDataCache()
  }

  async initFullData() {
    let data = this.amiiboDataCache.getData()
    if ( data == null ) {
      data = await this.amiiboApi.getData()
    }
    if ( data != null) {
      this.amiiboDataCache.setData(data)
    }
    return data
  }

  getDataSize() {
    return this.amiiboDataCache.data.length
  }

  getData(id) {
    return this.amiiboDataCache.getData(id)
  }

  async getImage(id, imageUrl) {
    let image = this.amiiboDataCache.getImage(id)
    if ( image == null ) {
      image = await this.amiiboApi.getImage(imageUrl)
      if ( image != null) {
        this.amiiboDataCache.setImage(image, id)
      }
    }
    return image
  }
}

class AmiiboApi {
// 
// Get Amiibo Data and Image from amiiboApi
// 
  constructor() {
    this.amiiboApiUrl = (type) => `https://amiiboapi.com/api/amiibo/?type=${type}`
  }

  async getData() {
    try {
      let dataFigures = await new Request( this.amiiboApiUrl("Figure") ).loadJSON()
      let dataYarn = await new Request( this.amiiboApiUrl("Yarn") ).loadJSON()
      return (dataFigures.amiibo).concat(dataYarn.amiibo)
    } catch (e) {
      console.log(e)
    }
    return null
  }

  async getImage(imageUrl) {
    try {
      let imgRequest = new Request(imageUrl)
      return await imgRequest.loadImage()
    } catch (e) {
      return null
    }
  }
}

class WidgetDataCache {
// 
// Access the local Widget Data Cache
// 
  constructor() {
    this.fm = this.getFileManager()
    this.widgetDirectory = this.getWidgetDirectory()
  }

  getFileManager() {
    let fm
    try {
      fm = FileManager.iCloud()
    } catch {
      fm = FileManager.local()
    }
    // check if user is logged into iCloud Drive
    try {
      fm.documentsDirectory()
    } catch {
      fm = FileManager.local()
    }
    return fm
  }

  getWidgetDirectory() {
    let directory = this.fm.joinPath( this.fm.documentsDirectory(), 'amiiboOfTheDay' )
    if ( ! this.fm.isDirectory(directory) ) {
      this.fm.createDirectory(directory)
    }
    return directory
  }
  
  deleteCacheOlderThan(days){
    const oneday = (24 * 60 * 60 * 1000)
    const xDaysAgo = ( Date.now() - (days * oneday) )
    this.fm.listContents(this.widgetDirectory)
    .map(path => this.fm.joinPath(this.widgetDirectory, path))
    .filter(path => this.fm.isDirectory(path))
    .filter(dir => ( this.fm.modificationDate(dir).getTime() < xDaysAgo ))
    .forEach(dir => {
      this.fm.remove(dir) 
    })
  }
}

class RandomDataCache extends WidgetDataCache {
// 
// Access the cache for the random data
// 
  constructor(){
    super()
    this.randomSeedFile = this.getRandomSeedFile()
  }

  getRandomSeedFile() {
    return this.fm.joinPath( this.widgetDirectory, 'randomseed.json' )
  }
  
  generateRandomSeedData(todayInDays) {
    let seedData = {}
    seedData[todayInDays] = {}
    for (let i=0; i<=23; i++) {
      seedData[todayInDays][i] = Math.random()
    }
    return seedData
  }

  saveRandomSeed (seedData) {
    this.fm.writeString( this.randomSeedFile, JSON.stringify(seedData) )
  }

  getRandomSeed(todayInDays) {
    if ( this.fm.fileExists(this.randomSeedFile) ) {
      try {
        let data = JSON.parse( this.fm.readString( this.randomSeedFile ) )
        if (data.hasOwnProperty(todayInDays)){
          return data
        }
      } catch (e) {
        console.log(e)
      }
    }
    return this.generateRandomSeedData(todayInDays)
  }
}

class AmiiboDataCache extends WidgetDataCache {
// 
// Access the cache for the amiibo data
// 
  constructor() {
    super()
    this.amiiboDataFileName = (id) => `${id}-data.json`
    this.amiiboImageFileName = (id) => `${id}-image.png`
    this.data = []
  }

  amiiboDataFileIsOutdated(dataFilepath) {
    let today = new Date()
    let creationDate= this.fm.creationDate(dataFilepath)
    return (today.getFullYear() > creationDate.getFullYear() || today.getMonth() > creationDate.getMonth() || today.getDate() > creationDate.getDate())
  }

  getAmiiboIdDirectory(id) {
    return this.fm.joinPath(this.widgetDirectory, `${id}`)
  }

  createAmiiboidDirectory(id) {
    let directory = this.getAmiiboIdDirectory(id)
    if ( ! this.fm.isDirectory(directory) ) {
      this.fm.createDirectory(directory)
    }
    return directory
  }
  
  getData(paramId) {
    try {
      let id = paramId == null ? "full" : paramId
      let directory = this.getAmiiboIdDirectory(id)
      let dataFilepath = this.fm.joinPath(directory, this.amiiboDataFileName(id))
      if (this.fm.fileExists(dataFilepath)) {
        if (this.amiiboDataFileIsOutdated(dataFilepath)){
            console.log("data-file was created not created today, delete")
            this.fm.remove(dataFilepath)
            return null
        } else {
            return JSON.parse( this.fm.readString( dataFilepath ) )
        }
      } else {
        let amiiboData
        if (Number.isInteger(id)) {
          amiiboData = this.data[paramId]
          amiiboData.id = paramId
        } else {
          amiiboData =  this.data.find(amiibo => amiibo.name == paramId)
          amiiboData.id = this.data.indexOf(amiiboData)
        }
        return amiiboData
      }
    } catch (e) {
      console.log(e)
    }
    return null
  }

  getImage(id) {
    try {
      let directory = this.getAmiiboIdDirectory(id)
      let imageFilepath = this.fm.joinPath(directory, this.amiiboImageFileName(id))
      if (this.fm.fileExists(imageFilepath)) {
        return this.fm.readImage(imageFilepath)
      }
    } catch (e) {
      console.log(e)
    }
    return null
  }

  setData(data) {
    // set data in cache
    let id = "full"
    let directory = this.createAmiiboidDirectory(id)
    let dataFilepath = this.fm.joinPath( directory, this.amiiboDataFileName(id))
    this.fm.writeString( dataFilepath, JSON.stringify(data))
    // set data in memory
    this.data = data
  }

  setImage(image,id) {
    let directory = this.createAmiiboidDirectory(id)
    let imageFilepath = this.fm.joinPath( directory, this.amiiboImageFileName(id))
    this.fm.writeImage(imageFilepath, image)
  }
}

// Widget
let amiiboOfTheDayWidget = new AmiiboOfTheDayWidget()
await amiiboOfTheDayWidget.initData("Bowser")
let widget = await amiiboOfTheDayWidget.createWidget(amiiboId)
// display widget
await widget.presentLarge()
Script.setWidget( widget )
// complete
Script.complete()
// delete old cache
new WidgetDataCache().deleteCacheOlderThan(30)
