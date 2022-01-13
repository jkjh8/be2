const axios = require('axios')
const cheerio = require('cheerio')

module.exports.get = async (address) => {
  return new Promise(async (resolve, reject) => {
    try {
      const html = await axios.get(`http://${address}/status`)
      const rt = {}
      const $ = cheerio.load(html.data)
      $('dd').each((i, element) => {
        rt[$(element).find('span:nth-of-type(2)').attr('class')] = $(element)
          .find('span:nth-of-type(2)')
          .text()
          .trim()
      })
      resolve(rt)
    } catch (e) {
      reject(e)
    }
  })
}
