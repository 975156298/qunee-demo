function Qunee (id, data) {
    this.id = id
    this.graph = undefined
    this.model = undefined
    this.quneeData = data || []
    this.node = {}
    // this.edge = []
    this.edgeStyle = {
        width: 2,
        defaultColor: '#fff',
        selectColor: '#05ffea',
        shadowBlur: 7,
        showShadow: true
    }
    this.selectNodeStyle = {
        shadowBlur: 7,
        color: '#05ffea',
        shadowOffsetX: 0,
        shadowOffsetY: 0
    }
    this.selectEdgeStyle = {
        shadowBlur: 0,
        color: '',
        shadowOffsetX: 0,
        shadowOffsetY: 0
    }
    this.showArrowTo = false
    this.tooltip = {
        show: true,
        node: true,
        edge: false
    }
    this.imgData = {
        qq: './img/backgroundImg/qq.png',
        mac: './img/backgroundImg/mac.png',
        address: './img/backgroundImg/address.png',
        userId: './img/backgroundImg/userId.png',
        phone: './img/backgroundImg/phone.png',
        passport: './img/backgroundImg/passport.png',
        power: './img/backgroundImg/power.png',
        car: './img/backgroundImg/car.png',
        defaultQQ: './img/backgroundImg/default_qq.png',
        defaultMac: './img/backgroundImg/default_mac.png',
        defaultAddress: './img/backgroundImg/default_address.png',
        defaultUserId: './img/backgroundImg/default_userId.png',
        defaultPhone: './img/backgroundImg/default_phone.png',
        defaultPassport: './img/backgroundImg/default_passport.png',
        defaultPower: './img/backgroundImg/default_power.png',
        defaultCar: './img/backgroundImg/default_car.png',
    }
}

Qunee.prototype = {
    init () {
        this.graph = new Q.Graph(this.id)
        this.model = this.graph.graphModel
        this.createImg(this.imgData)
        this.bindEvent()
    },
    // 自动布局
    autoLayout (state = 'balloon') {
        // balloon => 气泡布局；spring => 弹性布局
        if (state === 'spring') {
            let layouter = new Q.SpringLayouter(this.graph)
            layouter.repulsion = 100
            layouter.attractive = 1
            layouter.elastic = 0.1
            layouter.start()
        }
        if (state === 'balloon') {
            let layouter = new Q.BalloonLayouter(this.graph)
            layouter.radiusMode = Q.Consts.RADIUS_MODE_UNIFORM
            layouter.radius = 100
            layouter.startAngle = Math.PI / 4
            layouter.doLayout({
                callback: function () {}
            })
        }
    },
    // 创建单个节点
    createNode (data) {
        // name => 下面的文字； x => 距离中心点x轴的距离； y => 距离中心点y轴的距离
        let node = this.graph.createNode(data.name || '', data.x || 0, data.y || 0)
        node.image = data.symbol
        node.size = {width: 50}
        // node.tooltip = this.createTooltip(data)
        this.selectStyle(node, 'node')
        node.set('data', data) // node.get('data') 用于获取数据
        this.node[data.id] = node
    },
    // 创建多个节点
    createNodes (nodes) {
        Q.forEach(nodes, (data) => {
            this.createNode(data)
        })
    },
    // 创建单条线
    createEdge (data) {
        let from =  this.node[data.from]
        let to =  this.node[data.to]
        if(!from || !to){
            return
        }
        let edge = this.graph.createEdge(data.name, from, to)
        if (!this.showArrowTo) {
            edge.setStyle(Q.Styles.ARROW_TO, false)
        }
        this.selectStyle(edge)
        this.setEdge(edge, data.color)
        edge.tooltip = ''
        edge.set('data', data)
    },
    // 创建多条线
    createEdges (edges) {
        Q.forEach(edges, (data) => {
            this.createEdge(data)
        })
    },
    // 创建提示框
    createTooltip (data, top, left) {
        let tooltipDom = `<div style="color:#00FFEB;font-weight:bold;font-size:13px">${data.type}</div><div style="color: #fff;font-size: 12px">${data.value}</div>`
        let tooltipParent = document.getElementsByClassName('Q-tooltip-update')[0]
        tooltipParent.innerHTML = tooltipDom
        tooltipParent.style.display = 'flex'
        tooltipParent.style.top = top + 'px'
        tooltipParent.style.left = left + 'px'
    },
    hideTooltip () {
        let tooltipParent = document.getElementsByClassName('Q-tooltip-update')[0]
        if (tooltipParent && tooltipParent.style) {
            tooltipParent.style.display = 'none'
        }
    },
    setTooltip () {
        if (this.tooltip.show) {
            let dom = document.getElementById(this.id)
            let ele = document.createElement('div')
            ele.className = 'Q-tooltip-update'
            ele.style.cssText= `display: none;background: url('./img/tooltip.png');border: none;background-size: 100% 100%;position: absolute;top: 40px;left: 100px;flex-direction: column;justify-content: center;align-items: flex-start;height: 70px;min-width: 60px;max-width: 168px;padding: 0 20px;color: #ffffff;`
            dom.appendChild(ele)
        } else {
            this.graph.enableTooltip = false
            this.graph.tooltipDelay = 0
            this.graph.tooltipDuration = 10000
        }
    },
    // 创建图谱 => 先创建点，然后创建线
    createPel (data = this.quneeData, state = false) {
        // state => true 代表是添加数据。false 代表初次加载
        if (state) {
            data = this.filterData(data)
            if (data.nodes.length > 0 || data.edges.length > 0) {
                data = this.updateData(data)
                console.log(data)
                this.addData(data, false)
            }
            this.createNodes(data.nodes)
            this.createEdges(data.edges)
            this.autoLayout()
        } else {
            data = this.updateData(data)
            console.log(this.quneeData)
            // this.quneeData = data
            this.createNodes(data.nodes)
            this.createEdges(data.edges)
        }
    },
    // 线的样式
    setEdge (edge, color = this.edgeStyle.defaultColor, data = {width: this.edgeStyle.width, shadowBlur: this.edgeStyle.shadowBlur, showShadow: this.edgeStyle.showShadow}) {
        edge.setStyle(Q.Styles.EDGE_COLOR, color)
        edge.setStyle(Q.Styles.EDGE_WIDTH, data.width)
        edge.setStyle(Q.Styles.LABEL_COLOR, color)
        if (data.showShadow) {
            edge.setStyle(Q.Styles.SHADOW_BLUR, data.shadowBlur)
            edge.setStyle(Q.Styles.SHADOW_COLOR, color)
        }
    },
    // 选中节点或线的样式 组件自带的。
    selectStyle (dom, type, style = {shadowBlur: 0, color: null, shadowOffsetX: null, shadowOffsetY: null}) {
        if (type === 'node') {
            style = {
                style,
                ...this.selectNodeStyle
            }
        }
        if (type === 'edge') {
            style = {
                style,
                ...this.selectEdgeStyle
            }
        }
        dom.setStyle(Q.Styles.SELECTION_SHADOW_BLUR, style.shadowBlur || 0)
        dom.setStyle(Q.Styles.SELECTION_COLOR, style.color || '#8F8')
        dom.setStyle(Q.Styles.SELECTION_SHADOW_OFFSET_X, style.shadowOffsetX || 0)
        dom.setStyle(Q.Styles.SELECTION_SHADOW_OFFSET_Y, style.shadowOffsetY || 0)
    },
    // 选中节点或线的样式 进行扩展出来的功能。由于默认select的样式存在，如果需要点击节点选中而点击其他非节点区域不恢复默认默认样式时，则可以使用该方法
    // 该方法必须与 selectStyle 同时使用。并且两者颜色一致。
    extendSelectStyle (dom, type, style = {shadowBlur: 0, color: '#fff', shadowOffsetX: 0, shadowOffsetY: 0}) {
        if (type === 'node') {
            style = {
                ...style,
                ...this.selectNodeStyle
            }
        }
        if (type === 'edge') {
            style = {
                style,
                ...this.selectEdgeStyle
            }
        }
        dom.setStyle(Q.Styles.SHADOW_BLUR, style.shadowBlur)
        dom.setStyle(Q.Styles.SHADOW_COLOR, style.color)
        dom.setStyle(Q.Styles.SHADOW_OFFSET_X, style.shadowOffsetX || 0)
        dom.setStyle(Q.Styles.SHADOW_OFFSET_Y, style.shadowOffsetY || 0)
    },
    // 创建图片
    createImg (imgData) {
        // imgData => {key: value},
        let key = Object.keys(imgData)
        Q.forEach(key, (data) => {
            Q.registerImage(data, imgData[data])
        })
    },
    addClick (callback) {
        this.graph.onclick = (evt) => {
            console.log(evt)
            let target = this.graph.hitTest(evt)
            // let nodeDom = this.graph.getElementByMouseEvent(evt)
            let node = evt.getData()
            console.log(node)
            if (target instanceof Q.LabelUI) {
                // 验证点的是不是label
                callback(evt.getData()._mj5.data)
            }
            if (node instanceof Q.Node) {
                this.showNodeAndEdge(node)
                // 验证点的是不是节点
                // this.resetImg()
                // node.image = node.get('data').selectSymbol
                let ui = this.graph.getUIByMouseEvent(evt)
                this.resetNodeStyle()
                this.extendSelectStyle(ui.data, 'node')
                callback(node.get('data'))
            }
            if (node instanceof Q.Edge) {
                // 验证点的是不是线
                callback(node.get('data'))
            }
            // evt.getData()._mj5.data 用于获取保存的数据
        }
    },
    addDblClick (callback) {
        this.graph.ondblclick = (evt) => {
            let node = this.graph.getElementByMouseEvent(evt)
            if (node instanceof  Q.Node) {
                // 验证点的是不是节点
                callback(evt.getData()._mj5.data)
            }
        }
    },
    // 用于绑定全局事情
    bindEvent () {
        this.graph.callLater(() => {
            this.autoLayout()
            this.graph.centerTo(0, 0, 1.5)
            // 下面代码用于隐藏 组件的一些默认文字
            let canvasDom = document.getElementsByClassName('Q-Canvas')[1]
            canvasDom.style.display = 'none'
            this.setTooltip()
        })
        this.graph.onlongpress = (evt) => {
            let ui = this.graph.getUIByMouseEvent(evt)
            this.resetNodeStyle()
            this.extendSelectStyle(ui.data, 'node')
        }
        /* this.model.dataChangeDispatcher.addListener({
            onEvent: function(evt){
                console.log(evt, '111111111111111111')
            }
        }) */
        this.graph.onmousemove  = (evt) => {
            let node = evt.getData()
            let target = this.graph.hitTest(evt)
            this.hideTooltip()
            if (target instanceof Q.LabelUI) {
                // 验证点的是不是label
                console.log('文字')
                this.graph.enableTooltip = this.tooltip.edge
            }
            if (node instanceof Q.Node) {
                // 验证点的是不是节点
                console.log('节点')
                let p = this.graph.globalToLocal(evt)
                this.graph.enableTooltip = this.tooltip.node
                this.createTooltip(node.get('data'), p.y + 30, p.x + 30)
            }
            if (node instanceof Q.Edge) {
                // 验证点的是不是线
                console.log('线')
                this.graph.enableTooltip = this.tooltip.edge
            }
        }

    },
    // 改方法用于还原数据成默认图片
    resetImg () {
        Q.forEach(this.quneeData.nodes, (data) => {
            this.node[data.id].image = data.defaultSymbol
        })
    },
    // 当使用 extendSelectStyle 方法修改样式后，则可以通过该方法进行还原
    resetNodeStyle () {
        Q.forEach(this.quneeData.nodes, (data) => {
            this.extendSelectStyle(this.node[data.id])
        })
    },
    // 主要用于去除重复的点和线
    filterData (data) {
        data.nodes = data.nodes.filter((item) => {
            return this.quneeData.nodes.every((itemChild) => {
                return itemChild.id !== item.id
            })
        })
        data.edges = data.edges.filter((item) => {
            return this.quneeData.edges.every((itemChild) => {
                return itemChild.from !== item.from || itemChild.to !== item.to
            })
        })
        return data
    },
    // 用于向 this.quneeData 里面添加点和线
    addData (data, state = true) {
        // state => 代表是否需要过滤，默认过滤
        if (state) {
            data = this.filterData(data)
        }
        this.quneeData.nodes = this.quneeData.nodes.concat(data.nodes)
        this.quneeData.edges = this.quneeData.edges.concat(data.edges)
        return this.quneeData
    },
    // 用于更新 数据里的相关字段
    updateData (data) {
        Q.forEach(data.edges, (item) => {
            if (parseFloat(item.flag) === 1) {
                item.color = this.edgeStyle.selectColor
            } else {
                item.color = this.edgeStyle.defaultColor
            }
            return item
        })
        console.log(data)
        return data
    },
    hideNodeAndEdge () {

    },
    showNodeAndEdge (node) {
        // this.model.isVisible(false)
    }
}
