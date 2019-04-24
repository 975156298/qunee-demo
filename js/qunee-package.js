//
/*
*  说明： node 代表节点， edge 代表线。
*
*  new Qunee 参数说明
*  id : 相应dom元素的id, 必填
*  data : 显示的数据。
* edgeStyle : edge（线）的基本样式。
* selectNodeStyle :  选中node（节点）的样式
* selectEdgeStyle : 选中edge（线）的样式
* showArrowTo : 是否显示箭头，false 不显示
* tooltip : 提示框相关参数
* imgData : 需要转换的图片。传入图片默认进行转换
* label : 用于替换源数据的字段名。 包括node 和 edge 字段名（只推荐替换全局相关的，不推荐替换 node 和 edge 字段名），但推荐使用 nodeLabel、edgeLabel替换。
* nodeLabel : 用于替换源数据的node字段名
* edgeLabel : 用于替换源数据的edge字段名
* layout : 设置自动布局 balloon => 气泡布局；spring => 弹性布局
*
* */
function Qunee (id, data, params = {}) {
    this.id = id // 相应dom元素的id
    // edge（线）的基本样式。
    this.edgeStyle = {
        width: 2,
        defaultColor: '#fff',
        selectColor: '#05ffea',
        shadowBlur: 7,
        showShadow: true,
        ...params.edgeStyle
    }
    // 选中node（节点）的样式
    this.selectNodeStyle = {
        shadowBlur: 7,
        color: '#05ffea',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        ...params.selectNodeStyle
    }
    // 选中edge（线）的样式
    this.selectEdgeStyle = {
        shadowBlur: 0,
        color: '',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        ...params.selectEdgeStyle
    }
    // 是否显示箭头，false 不显示
    this.showArrowTo = params.showArrowTo || false
    this.tooltip = {
        show: true, // true 显示自己书写的tooltip，false 显示组件自带tooltip（不推荐使用）
        node: true, // 是否显示node tooltip
        edge: false, // 是否显示edge tooltip
        ...params.tooltip
    }
    // 该参数代表需要转换的图片。
    this.imgData = params.imgData || {}
    // label 用于对数据的字段名进行转换后，适应组件的字段名
    this.label = {
        enable: true, // 代表是否启用字段名转换。默认启动（true）
        nodes: 'nodes', // 代表包含node的大对象名
        edges: 'edges', // 代表包含 edges 的大对象名
        node: {
            name: 'name',
            x: 'x',
            y: 'y',
            id: 'id',
            symbol: 'symbol',
            defaultSymbol: 'defaultSymbol',
            selectSymbol: 'selectSymbol',
            type: 'type',
            value: 'value',
            ...params.nodeLabel
        },
        edge: {name: 'name', from: 'from', to: 'to', flag: 'flag', ...params.edgeLabel},
        ...params.label
    }
    this.layout = 'spring' || params.layout
    // 不可传参修改的参数
    this.graph = undefined  // qunee 对象
    this.model = undefined  // qunee model 对象
    this.quneeData = data || {} // 传入的数据
    this.node = {} // 保存节点的数据 {id: node节点}
    this.edge = {} // 保存先数据 { form: { to: edge数据 }}
}

Qunee.prototype = {
    init () {
        if (this.label.enable) {
            this.quneeData = this.createNewData()
        }
        this.graph = new Q.Graph(this.id)
        this.model = this.graph.graphModel
        this.createImg(this.imgData)
        this.bindEvent()
    },
    // 自动布局
    autoLayout (state = this.layout) {
        // balloon => 气泡布局；spring => 弹性布局
        if (state === 'spring') {
            let layouter = new Q.SpringLayouter(this.graph)
            layouter.repulsion = 150
            layouter.attractive = 1
            layouter.elastic = 10
            layouter.start()
        }
        if (state === 'balloon') {
            let layouter = new Q.BalloonLayouter(this.graph)
            // layouter.radiusMode = Q.Consts.RADIUS_MODE_VARIABLE
            // layouter.angleSpacing = Q.Consts.ANGLE_SPACING_REGULAR
            layouter.radius = 40
            layouter.gap = 50
            layouter.startAngle = Math.PI / 4
            layouter.doLayout({
                // byAnimate: true,
                callback: function () {
                    // this.graph.zoomToOverview()
                }
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
        let from = this.node[data.from]
        let to = this.node[data.to]
        if (!from || !to) {
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
        if (!this.edge[data.from]) {
            this.edge[data.from] = {}
        }
        this.edge[data.from][data.to] = edge
    },
    // 创建多条线
    createEdges (edges) {
        Q.forEach(edges, (data) => {
            this.createEdge(data)
        })
    },
    // 创建提示框
    createTooltip (data, top, left) {
        if (data.type === '车牌号') {
            let tooltipDom = `<div style="display: flex;">
                                <div style="color:#00FFEB;font-weight:bold;font-size:13px">车辆分类:&nbsp;</div>
                                <div style="color: #fff;font-size: 12px">${data.subclass || '暂无'}</div>
                              </div>
                              <div style="display: flex;">
                                <div style="color:#00FFEB;font-weight:bold;font-size:13px">${data.type}:&nbsp;</div>
                                <div style="color: #fff;font-size: 12px">${data.value}</div>
                              </div>`
            let tooltipParent = document.getElementsByClassName('Q-tooltip-update')[0]
            tooltipParent.innerHTML = tooltipDom
            tooltipParent.style.display = 'flex'
            tooltipParent.style.top = top + 'px'
            tooltipParent.style.left = left + 'px'
        } else {
            let tooltipDom = `<div style="color:#00FFEB;font-weight:bold;font-size:13px">${data.type}</div><div style="color: #fff;font-size: 12px">${data.value}</div>`
            let tooltipParent = document.getElementsByClassName('Q-tooltip-update')[0]
            tooltipParent.innerHTML = tooltipDom
            tooltipParent.style.display = 'flex'
            tooltipParent.style.top = top + 'px'
            tooltipParent.style.left = left + 'px'
        }
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
            ele.style.cssText = `display: none;background: url('./img/tooltip.png');border: none;background-size: 100% 100%;position: absolute;top: 40px;left: 100px;flex-direction: column;justify-content: center;align-items: flex-start;height: 70px;min-width: 60px;max-width: 168px;padding: 0 20px;color: #ffffff;`
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
                this.addData(data, false)
            }
            this.createNodes(data.nodes)
            this.createEdges(data.edges)
            this.autoLayout()
        } else {
            data = this.updateData(data)
            // this.quneeData = data
            this.createNodes(data.nodes)
            this.createEdges(data.edges)
        }
    },
    // 线的样式
    setEdge (edge, color = this.edgeStyle.defaultColor, data = {
        width: this.edgeStyle.width,
        shadowBlur: this.edgeStyle.shadowBlur,
        showShadow: this.edgeStyle.showShadow
    }) {
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
        dom.setStyle(Q.Styles.BACKGROUND_COLOR, 'transparent')
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
            let target = this.graph.hitTest(evt)
            // let nodeDom = this.graph.getElementByMouseEvent(evt)
            let node = evt.getData()
            if (target instanceof Q.LabelUI) {
                // 验证点的是不是label
                callback(evt.getData()._mj5.data)
            }
            if (node instanceof Q.Node) {
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
            if (node instanceof Q.Node) {
                // 验证点的是不是节点
                callback(evt.getData()._mj5.data)
            }
        }
    },
    // 用于绑定全局事情
    bindEvent () {
        // 初次画图完成后的回调
        this.graph.callLater(() => {
            this.autoLayout()
            this.graph.centerTo(0, 0, 1.5)
            // 下面代码用于隐藏 组件的一些默认文字
            let canvasDom = document.getElementsByClassName('Q-Canvas')[1]
            canvasDom.style.display = 'none'
            this.setTooltip()
        })
        // 监听鼠标长按事情
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
        // 监听鼠标移动事情
        this.graph.onmousemove = (evt) => {
            let node = evt.getData()
            let target = this.graph.hitTest(evt)
            this.hideTooltip()
            this.showNodeAndEdge()
            if (target instanceof Q.LabelUI) {
                // 验证点的是不是label
                this.graph.enableTooltip = this.tooltip.edge
            }
            if (node instanceof Q.Node) {
                // 验证点的是不是节点
                this.toggleNode(node)
                let p = this.graph.globalToLocal(evt)
                this.graph.enableTooltip = this.tooltip.node
                this.createTooltip(node.get('data'), p.y + 30, p.x + 30)
            }
            if (node instanceof Q.Edge) {
                // 验证点的是不是线
                this.toggleEdge(node)
                this.graph.enableTooltip = this.tooltip.edge
            }
        }
        // 监听鼠标拖动中事情
        this.graph.ondrag = (evt) => {
            this.hideTooltip()
            let node = evt.getData()
            if (node instanceof Q.Node) {
                let p = this.graph.globalToLocal(evt)
                this.createTooltip(node.get('data'), p.y + 30, p.x + 30)
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
        return data
    },
    // 用于设置全部元素的可见度
    setNodeAndEdge (opacity = 0.1) {
        let nodeKey = Object.keys(this.node)
        Q.forEach(nodeKey, (key) => {
            this.node[key].setStyle(Q.Styles.ALPHA, opacity)
        })
        let edgesKey = Object.keys(this.edge)
        Q.forEach(edgesKey, (key) => {
            let childEdgesKey = Object.keys(this.edge[key])
            Q.forEach(childEdgesKey, (childKey) => {
                this.edge[key][childKey].setStyle(Q.Styles.ALPHA, opacity)
            })
        })
    },
    // 显示全部节点和线
    showNodeAndEdge () {
        this.setNodeAndEdge(1)
    },
    // 隐藏全部节点和线
    hideNodeAndEdge () {
        this.setNodeAndEdge(0.1)
    },
    // 显示相关联的节点，非关联的不显示
    toggleNode (node) {
        this.hideNodeAndEdge()
        let data = node.get('data')
        let edges = this.edge[data.id]
        this.node[data.id].setStyle(Q.Styles.ALPHA, 1)
        if (edges) {
            let edgesChildKey = Object.keys(this.edge[data.id])
            Q.forEach(edgesChildKey, (key) => {
                this.edge[data.id][key].setStyle(Q.Styles.ALPHA, 1)
                this.node[key].setStyle(Q.Styles.ALPHA, 1)
            })
        }
        let edgesKey = Object.keys(this.edge)
        Q.forEach(edgesKey, (key) => {
            let childEdgesKey = Object.keys(this.edge[key])
            Q.forEach(childEdgesKey, (childKey) => {
                if (childKey === data.id || childKey === JSON.stringify(data.id)) {
                    this.edge[key][childKey].setStyle(Q.Styles.ALPHA, 1)
                    this.node[key].setStyle(Q.Styles.ALPHA, 1)
                }
            })
        })
    },
    // 显示相关联的线，非关联的不显示
    toggleEdge (edge) {
        this.hideNodeAndEdge()
        let data = edge.get('data')
        this.edge[data.from][data.to].setStyle(Q.Styles.ALPHA, 1)
        this.node[data.from].setStyle(Q.Styles.ALPHA, 1)
        this.node[data.to].setStyle(Q.Styles.ALPHA, 1)
    },
    // 用于整合数据的字段名。该方法只能由组件自己调用，外部慎用。
    createNewData (data = this.quneeData) {
        let key = Object.keys(data)
        if (key.length > 0) {
            let newData = {
                nodes: [],
                edges: []
            }
            newData.nodes = data[this.label.nodes].map((item) => {
                let label = this.label.node
                let val = {}
                val.name = item[label.name]
                val.x = item[label.x] || 0
                val.y = item[label.y] || 0
                val.id = item[label.id]
                val.symbol = item[label.symbol] || ''
                val.defaultSymbol = item[label.defaultSymbol] || ''
                val.selectSymbol = item[label.selectSymbol] || ''
                val.type = item[label.type] || ''
                val.value = item[label.value] || ''
                val = {
                    ...val,
                    ...this.getObjectVal(item, Object.keys(this.label.nodes))
                }
                return val
            })
            newData.edges = data[this.label.edges].map((item) => {
                let label = this.label.edge
                let val = {}
                val.name = item[label.name]
                val.from = item[label.from] || 0
                val.to = item[label.to] || 0
                val.flag = item[label.flag]
                val = {
                    ...val,
                    ...this.getObjectVal(item, Object.keys(this.label.edges))
                }
                return val
            })
            return newData
        } else {
            return data
        }
    },
    // 用于获取对象剩下的值。
    getObjectVal (data, key = ['name', 'x', 'y', 'id', 'symbol', 'defaultSymbol', 'selectSymbol', 'type', 'value']) {
        let val = {}
        let valKey = Object.keys(data)
        Q.forEach(valKey, (keyItem) => {
            if (key.indexOf(keyItem) === -1) {
                val[keyItem] = data[keyItem]
            }
        })
        return val
    }
}
