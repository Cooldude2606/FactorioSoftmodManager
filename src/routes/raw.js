const Express = require('express')
const Router = Express.Router()
const {ModuleJson} = require('../database')

Router.get('/all',async (req,res) => {
    res.json(await ModuleJson.findAll({attributes: ['id', 'name', 'version']}))
})

Router.get('/add/:name',(req,res) => {
    const name = req.params.name
    const version = req.query.version || '1.0.0'
    ModuleJson.sync().then(() => {
        ModuleJson.create({
            name: name,
            version: version
        })
    })
    res.send('Hello, World!')
})

Router.get('/clear',async (req,res) => {
    await ModuleJson.sync()
    const removed = await ModuleJson.destroy({where:{}})
    res.send(`Destroied ${removed} entries!`)
})

module.exports = Router