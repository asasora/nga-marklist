// ==UserScript==
// @name         NGA 收藏按钮 demo
// @namespace    https://github.com/asasora/nga-marklist
// @version      2026-01-12
// @description  try to take over the world!
// @author       朝苍琴月
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @match        *://nga.178.com/*
// @match        *://g.nga.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nga.cn
// @grant        none
// @require      https://cdn.rawgit.com/muicss/sentineljs/0.0.5/dist/sentinel.min.js
// @updateURL    https://raw.githubusercontent.com/asasora/nga-marklist/main/NGA-MarkList.user.js
// @downloadURL  https://raw.githubusercontent.com/asasora/nga-marklist/main/NGA-MarkList.user.js
// ==/UserScript==

/* globals sentinel */
/* ==============
 * 数据与持久化
 * data.setting={top:'',left:''}
 * data.mark = {
 *      `45285585#2881`:{
 *          tid:'45285585',
 *          lou:'2881',
 *          title:'证物选钢笔证人是自己的樱羽艾玛正在当律师的样子(当前进度：第三章·城崎诺亚案·庭审阶段)'
 *      },
 *      `${tid}#${lou}`:{
 *          tid:'${tid}',
 *          lou:'${lou}',
 *          title:'title'
 *      }
 * }
 * =============== */

(function () {
    'use strict';
    /*==========
    * 基础存取函数
    * ========== */
    function initializationMarkList(data) {
        if (!data.setting) data.setting = {};
        if (!data.mark) data.mark = {};
        for (const key of Object.keys(data.mark)) {
            if (!data.mark[key]) data.mark[key] = { tid: '', lou: '', title: '' }
            if (data.mark[key].tid == null) data.mark[key].tid = "";
            if (data.mark[key].lou == null) data.mark[key].lou = "";
            if (data.mark[key].title == null) data.mark[key].title = "";
        }
        if (!data.setting.top) data.setting.top = '';
        if (!data.setting.left) data.setting.left = '';
        return data;
    }

    function loadMarkList() {
        const raw = localStorage.getItem('NGA_marklist') || "{}";
        let parse;
        try {
            parse = raw ? JSON.parse(raw) : {};
            state.data = initializationMarkList(JSON.parse(raw));
        } catch {
            parse = {};
        }
        if (Array.isArray(parse) || typeof parse !== 'object') {
            parse = {};
        }
        state.data = initializationMarkList(parse);
        console.log('加载书签数据完成');
    }

    function saveMarkList() {
        console.log('存储中...');
        localStorage.setItem('NGA_marklist', JSON.stringify(state.data));
        console.log(localStorage.getItem('NGA_marklist'));
    }

    /*==========
    * 数据操作函数
    * ========== */

    function addMarkToList(tid, lou, title) {
        let key = `${tid}#${lou}`;
        state.data.mark[key] = { tid: tid, lou: lou, title: title };
        saveMarkList();
    }

    function removeMarkFromList(tid, lou) {
        let key = `${tid}#${lou}`;
        delete state.data.mark[key];
        saveMarkList();
    }

    function removeMarksByTid(tid) {
        let data = state.data;
        for (const key of Object.keys(data.mark)) {
            if (data.mark[key].tid == tid) {
                delete data.mark[key];
            }
        }
        saveMarkList();
    }

    function coverMarkTid(tid, lou, title) {
        // 删除旧书签，添加新书签
        // 遍历数据，找到对应 tid 的所有书签并删除
        removeMarksByTid(tid);
        // 添加新书签
        addMarkToList(tid, lou, title);
        showAlertPopup('已覆盖旧书签，添加新书签');
        console.log('已覆盖旧书签，添加新书签');
    }

    function notCoverMarkTid(tid, lou, title) {
        // 直接添加新书签
        addMarkToList(tid, lou, title);
        showAlertPopup('已添加新书签');
        console.log('未覆盖旧书签，添加新书签');
    }

    function checkMarkList(tid, lou) {
        let key = `${tid}#${lou}`;
        let data = state.data;
        if (data.mark.hasOwnProperty(key)) {
            return true;
        } else {
            return false;
        }
    }

    function checkMarkListTid(tid) {
        let data = state.data;
        for (const key of Object.keys(data.mark)) {
            if (data.mark[key].tid == tid) {
                return true;
            }
        }
        return false;
    }


    // --！ 重要 书签按钮函数
    function clickMarkButton() {
        console.log('点击了添加书签按钮');

        //数据抓取
        let sharpLou = getButtonLou();
        let lou = sharpLou.replace('#', '');
        console.log(sharpLou);

        let tid = getButtonTid();
        console.log(tid);

        let title = getTitleFromWindow();
        console.log(title);

        //检查书签是否存在
        if (checkMarkList(tid, lou)) {
            showAlertPopup('该书签已存在');
            return;
        }
        //检查同 tid 书签是否存在
        if (checkMarkListTid(tid)) {
            let userAnswer = showCheckCoverMarkPopup();
            userAnswer.Yes = () => { coverMarkTid(tid, lou, title); };
            userAnswer.No = () => { notCoverMarkTid(tid, lou, title); };
            return;
        }
        // 添加书签
        addMarkToList(tid, lou, title);
        showAlertPopup('已添加新书签');
        console.log('已添加新书签');
    }

    /*==========
    * 抓取函数
    * ========== */
    function getButtonLou() {
        const div = document.querySelector('.tip_title');
        const posts = div.querySelector('span');
        let sharpLou = posts.textContent;
        return sharpLou;
    }

    function getButtonTid() {
        return new URL(document.URL).searchParams.get('tid');
    }

    function getTitleFromWindow() {
        let title = window.currentTopicName.textContent;
        let reg = /\[[^\]]*\]/g;
        title = title.replace(reg, "").trim();
        return title;
    }


    /*==========
    * 前端
    * ========== */

    function addMarkButton() {
        // 找到框里面的容器元素
        const div = document.querySelector('.ltxt');
        const posts = div.querySelector('span');
        console.log('开始添加按钮');
        if (posts.querySelector('a:last-child').innerHTML == '添加书签') {
            console.log('已跳过添加按钮');
            return;
        }
        // 找到它的最后一个 button，克隆一个，再 append 回容器（增加一个按钮）
        const button = posts.querySelector('a:last-child').cloneNode();
        posts.appendChild(button);
        button.innerHTML = '添加书签';
        button.addEventListener('click', () => {
            clickMarkButton();
        })
    }

    function showMarkListPopup() {
        // 1. 创建一个容器 div
        const wrapper = document.createElement('div');
        //把书签转成数组，后续使用
        const markItems = Object.values(state.data.mark);
        //生成列表
        let listHTML = '';
        if (markItems.length === 0) {
            listHTML = `<div class="mark-empty">暂无书签</div>`;
        } else {
            //把数组中的每个元素转成 HTML 字符串
            listHTML = markItems.map(markitem => {
                //对于每个书签，生成对应的 HTML，应用mark-title和mark-lou类，它们的样式在style定义
                //用title显示完整标题，这样标题过长时悬停可以看到完整标题
                return `
                <div class="mark-item" data-tid="${markitem.tid}" data-lou="${markitem.lou}">
                    <span class="mark-title" title="${markitem.title}">
                        ${markitem.title}
                    </span>
                    <div class="mark-actions">
                        <span class="mark-lou">#${markitem.lou}</span>
                        <button class="mark-delete" title="删除">✕</button>
                    </div>
                </div>
                `;
            }).join('');//用join连接成一个大字符串
        }

        // 2. 使用模板字符串写入 HTML + CSS
        wrapper.innerHTML = `
        <style>
        .popup-mask {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }

        .popup-box {
            width: 360px;
            max-height: 420px;
            background: #fff;
            border-radius: 10px;
            padding: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            font-family: system-ui, Arial;
            display: flex;
            flex-direction: column;
        }

        .popup-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .mark-list {
            overflow-y: auto;
            flex: 1;
            border-top: 1px solid #eee;
            padding-top: 8px;
        }

        .mark-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 4px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
        }

        .mark-title {
            max-width: 240px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            cursor: default;
        }

        .mark-lou {
            color: #999;
            font-size: 12px;
            margin-left: 10px;
            flex-shrink: 0;
        }

        .mark-empty {
            text-align: center;
            color: #999;
            padding: 20px 0;
        }

        .popup-close {
            margin-top: 10px;
            align-self: flex-end;
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            background: #111;
            color: #fff;
            cursor: pointer;
        }
        .mark-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .mark-delete {
            border: none;
            background: transparent;
            color: #999;
            cursor: pointer;
            font-size: 14px;
            padding: 2px 4px;
        }

        .mark-delete:hover {
            color: #d00;
        }

        </style>

        <div class="popup-mask">
        <div class="popup-box">
            <div class="popup-title">我的书签</div>
            <div class="mark-list">
                ${listHTML}
            </div>
            <button class="popup-close">关闭</button>
        </div>
        </div>
        `;

        // 3. 挂到 body 上
        document.body.appendChild(wrapper);

        // 4. 绑定关闭逻辑
        wrapper.querySelector('.popup-close').onclick = function () {
            wrapper.remove();
        };

        // 5. 绑定书签点击逻辑
        //对于每个mark-item，绑定点击事件
        wrapper.querySelectorAll('.mark-item').forEach(item => {
            item.onclick = function () {
                const tid = item.dataset.tid;
                const lou = Number(item.dataset.lou);
                const page = Math.floor(lou / 20) + 1;
                const host = window.location.host;
                //缓存一个Lou，用于跳转后滚动
                sessionStorage.setItem('nga_scrollToLou', lou);
                //计算跳转 URL
                const url = `https://${host}/read.php?tid=${tid}&page=${page}#${lou}`;
                //跳转（等价于在浏览器输入 URL）
                location.href = url;
            };
        });
        //对于每个删除按钮，绑定点击事件
        wrapper.querySelectorAll('.mark-delete').forEach(button => {
            button.onclick = function (e) {
                e.stopPropagation();//阻止事件冒泡，避免触发上层的 mark-item 点击事件

                const item = button.closest('.mark-item');
                const tid = item.dataset.tid;
                const lou = item.dataset.lou;

                //从数据中删除该书签
                removeMarkFromList(tid, lou);

                //从DOM中删除该元素
                item.remove();

                //如果列表为空，显示“暂无书签”提示
                const markList = wrapper.querySelector('.mark-list');
                if (markList.children.length === 0) {
                    markList.innerHTML = `<div class="mark-empty">暂无书签</div>`;
                }
            };
        });
    }

    // 滚动到指定楼层的函数
    function scrollToLou() {
        //从sessionStorage读取缓存的楼层
        // **跨页面通讯需要用sessionStorage,因为跳转之后页面会重新加载，变量会消失**
        const lou = Number(sessionStorage.getItem('nga_scrollToLou'));
        if (!lou) return;
        sessionStorage.removeItem('nga_scrollToLou');
        //因为NGA的内容是动态加载的，所以需要轮询检测目标元素是否存在
        let retry = 0;//重试计数，防止无限循环
        //记录top位置，以便在滚动时动态更新
        let lastTop = null;
        let stableCount = 0;
        /*
        **为什么用setInterval而不是setTimeout？**
        **因为setInterval可以持续检测，直到找到目标元素或者超时；
          而setTimeout只能执行一次，可能需要多次调用。
          这里的逻辑是：我不管你什么时候加载完，我每 100ms 来问一次：目标元素在不在？**
        **主动通讯，而不是被动等待**
        */
        const timer = setInterval(() => {
            retry++;
            //尝试找到目标楼层的元素
            /*
            **这段很重要**
            因为NGA的不同版本/年代/移动端的元素可能不一样
            所以使用这种方式找Lou元素：
            */
            const target =
                document.querySelector(`[id="postcontent${lou}"]`) ||
                document.querySelector(`[name="${lou}"]`) ||
                document.querySelector(`a[name="${lou}"]`);
            //找到目标后将目标元素滚动到可视区域中央
            if (!target) {
                if(retry>50)clearInterval(timer);//超过5秒还没找到就放弃
                return;
            }

            //计算目标元素距离页面顶部的距离
            const top = target.getBoundingClientRect().top + window.pageYOffset-100;//留一点距离，避免贴在最上面
            
            
            window.scrollTo({
                top,
                behavior:'auto'
            });

            //检测是否已经稳定在目标位置
            if(lastTop!==null&&Math.abs(lastTop - top)<2){
                stableCount++;
            }else{
                stableCount=0;
            }

            lastTop = top;

            //如果已经稳定了3次，就认为滚动完成，停止检测
            if(stableCount>=3){
                clearInterval(timer);
            }
        }, 200);
    }

    /*==========
    * 弹框事件
    * ========== */

    function showCheckCoverMarkPopup() {
        // 1. 创建一个容器 div
        const wrapper = document.createElement('div');
        let answer = { Yes: () => { }, No: () => { }, Cancel: () => { } };
        // 2. 使用模板字符串写入 HTML + CSS
        wrapper.innerHTML = `
        <style>
            .popup-mask {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            }

            .popup-box {
            width: 320px;
            background: #fff;
            border-radius: 10px;
            padding: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            font-family: system-ui, Arial;
            }

            .popup-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            }

            .popup-content {
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            }

            .popup-description {
            margin-left: 6px;
            font-size: 12px;
            line-height: 1.6;
            color: #999;
            }

            .popup-Yes {
            margin-top: 14px;
            padding: 8px 13px;
            border: none;
            border-radius: 8px;
            background: #111;
            color: #fff;
            cursor: pointer;
            }

            .popup-No {
            margin-top: 14px;
            margin-left: 20px;
            padding: 8px 13px;
            border: none;
            border-radius: 8px;
            background: #111;
            color: #fff;
            cursor: pointer;
            }

            .div-Cancel {
            margin-left: -40px;
            margin-top: -150px;
            padding: 8px 14px;
            font-weight: bold;
            font-size: 18px;
            border: none;
            border-radius: 10px;
            background: rgba(0,0,0,0.0);
            color: #111;
            cursor: pointer;
            }
        </style>

        <div class="popup-mask">

            <div class="popup-box">
            <div class="popup-title">提示</div>
            <div class="popup-content">已存在该帖子的书签，是否覆盖？</div>
            <div class="popup-description">*是：删除该帖子的旧书签，添加新书签</div>
            <div class="popup-description">*否：不删除旧书签，添加新书签</div>
            <div class="popup-description">*取消：取消当前操作</div>
            <button class="popup-Yes">是</button>
            <button class="popup-No">否</button>
            </div>
            <button class="div-Cancel">x</button>
        </div>
        `;

        // 3. 挂到 body 上
        document.body.appendChild(wrapper);

        // 4. 绑定关闭逻辑
        wrapper.querySelector('.popup-Yes').onclick = function () {
            answer.Yes();
            wrapper.remove();
        };
        wrapper.querySelector('.popup-No').onclick = function () {
            answer.No();
            wrapper.remove();
        };
        wrapper.querySelector('.div-Cancel').onclick = function () {
            answer.Cancel();
            wrapper.remove();
        };
        return answer;
    }


    function showAlertPopup(text) {
        // 1. 创建一个容器 div
        const wrapper = document.createElement('div');

        // 2. 使用模板字符串写入 HTML + CSS
        wrapper.innerHTML = `
       <style>
        .popup-mask {
          position: fixed;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .popup-box {
          width: 320px;
          background: #fff;
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          font-family: system-ui, Arial;
        }

        .popup-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .popup-content {
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }

        .popup-description {
          margin-left: 6px;
          font-size: 12px;
          line-height: 1.6;
          color: #999;
        }

        .popup-Yes {
          margin-top: 14px;
          padding: 8px 13px;
          border: none;
          border-radius: 8px;
          background: #111;
          color: #fff;
          cursor: pointer;
        }
      </style>

      <div class="popup-mask">

        <div class="popup-box">
          <div class="popup-title">提示</div>
          <div class="popup-content">${text}</div>
          <button class="popup-Yes">确定</button>
        </div>
      </div>

    `;

        // 3. 挂到 body 上
        document.body.appendChild(wrapper);

        // 4. 绑定关闭逻辑
        wrapper.querySelector('.popup-Yes').onclick = function () {
            wrapper.remove();
        };
    }


    /*==========
    * 书签列表按钮
    * ========== */

    function createMarkListButton() {
        // 1. 创建一个按钮 markListButton
        const markListButton = document.createElement('div');

        // 2. 使用模板字符串写入 HTML + CSS
        markListButton.innerHTML = `
        <style>
            .listbutton {
            position: fixed;
            top: 70%;
            right: 10px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 50%;
            border: none;
            width:40px;
            height:40px;
            z-index: 999999;
            background: #F7F7F7;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
        </style>

        <button class="listbutton">🔖</button>
        `;
        // 3. 挂到 body 上
        document.body.appendChild(markListButton);
        // 4. 绑定点击事件
        const button = markListButton.querySelector('.listbutton');

        button.onclick = function () {
            if (moved) return;
            console.log(state.data);
            showMarkListPopup();
        };
        /* ------------ 拖拽相关的事件 ------------ */
        //拖拽相关的变量
        let isDragging = false;
        let startY, startX;
        let moved = false;

        button.addEventListener('mousedown', () => moved = false);

        document.addEventListener('mousemove', () => moved = true);

        //读取按钮位置
        if (state.data.setting.top !== '') {
            button.style.top = state.data.setting.top;
        }

        if (state.data.setting.left !== '') {
            button.style.left = state.data.setting.left;
        }

        // 5. 绑定鼠标拖动事件
        button.addEventListener('mousedown', (e) => {
            isDragging = true;
            button.classList.add('dragging');

            const buttonRect = button.getBoundingClientRect();
            startX = e.clientX - buttonRect.left;
            startY = e.clientY - buttonRect.top;

            e.preventDefault();
        });

        // 6. 鼠标拖动时移动位置
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            // 计算新位置（考虑鼠标偏移）
            const newTop = e.clientY - startY;
            const newLeft = e.clientX - startX;

            // 限制在视窗内
            const maxTop = window.innerHeight - 40;
            const maxLeft = window.innerWidth - 40;

            button.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
            button.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';

            button.style.right = 'auto';
            button.style.transform = 'translateY(0)';

        });

        // 7. 鼠标释放时停止拖动并保存位置
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;

            isDragging = false;
            button.classList.remove('dragging');

            //保存位置
            state.data.setting.top = button.style.top;
            state.data.setting.left = button.style.left;
            saveMarkList();
        })

    }

    /*==========
    * main
    * ========== */

    const state = { data: { setting: {}, mark: {} } };
    loadMarkList();
    //创建书签列表按钮
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createMarkListButton);
    } else {
        createMarkListButton();
    }
    //滚动到指定楼层
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scrollToLou);
    } else {
        scrollToLou();
    }

    //监听
    sentinel.on('.postoptb', function (el) {
        console.log('发现齿轮');
        el.addEventListener('click', addMarkButton);
    });

    sentinel.on('.postbtnsc', function (el) {
        const moreButton = Array.from(el.querySelectorAll('a')).slice(-1)[0];
        console.log('悬停中');
        moreButton.removeEventListener('click', addMarkButton);
        moreButton.addEventListener('click', addMarkButton);
    });



})();