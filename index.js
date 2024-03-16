const { createApp } = Vue;
createApp({
    data() {
        return {
            origin: {},
            ip: '',
            duration: 0,
            interval: null,
            swiperList: [],
            swiperHandle: [],
            curImgIndex: 0,
            directoryHandle: {},
            autoDelete: false,
            handleNum: 0,
            noHandleNum: 0,
            passNum: 0,
            failNum: 0,
            loading: true,
            turbo: false,
            greeting: "你好啊",
            privacyMode: false,//隐私模式
            tips: [
                "点击红色按钮或者按下键盘'←'键，将图片移动到deleteImgs文件夹",
                "点击白色按钮或者按下键盘'→'键，将图片移动到savedImgs文件夹，可选择关闭页面时彻底清除",
                '点击原目录名称可更换源目录',
                "隐私键'~',一键模糊所有图片"
            ],
            warning: [
                '本项目仅供学习交流，完全免费，不得私自用于商业用途',
                '所有图片均为本地处理,不会上传到任何服务器',
                '本项目使用技术尚在研究阶段,大部分浏览器不支持此API,请使用edge浏览器或者chrome浏览器',
                '如上面所言,用的是尚在研发中的API,所以可能会有一些小bug,请谅解',
                '使用中遇见问题可将遇见的问题发送至邮箱: <a href="mailto:1522024324@qq.com">1522024324@qq.com</a>',
                "交流群:<a href='https://qm.qq.com/q/r143Zn6GSA' target='_blank'>点击加入</a>",
                "如果觉得本项目对您有帮助,可以<a href='https://longhao.tech/donation' target='_blank'>请我喝杯咖啡</a>,谢谢您的支持",

            ],
            noOiginTip: [
                "<p class='warn'>本项目基于File System API开发,目前只有<a href='https://www.microsoft.com/zh-cn/edge' target='_blank'>Edge浏览器</a>和<a href='https://www.google.cn/intl/zh-CN/chrome/' target='_blank'>Chrome浏览器</a>对此技术支持尚可,如遇问题请先下载这两种浏览器尝试一下</p>",
                "<p class='info'>",
                '第一步：点击按钮选择源目录（仅支持处理图片）',
                "第二步：弹出的授权按钮点击'查看文件'和'保存更改'，授权浏览器访问本地文件系统",
                '第三步：选择源目录后，会自动加载源目录下的所有图片文件',
                '第四步：点击红色按钮或者按下键盘←键，将图片移动到deleteImgs文件夹',
            ],
        }
    },
    mounted() {
        const that = this
        const bgImg = new Image();
        bgImg.src = 'https://longhao.tech/SDtool/wpback2k.png';
        bgImg.onload = function () {
            that.loading = false
            // 可以在这里对页面进行操作，如隐藏加载动画等
        };
        bgImg.onerror = function () {
            that.loading = false
            console.error('背景图片加载失败!');
        };
        document.addEventListener('keydown', function (event) {
            // 检查 ` 键是否被按下
            console.log('keydown',event)
            if (event.key === '`') {
                that.privacyMode = !that.privacyMode
            }
            // 检查是否是左箭头键(键码37)
            if (event.key === 'ArrowLeft') {
                that.deleteImg()
            }
            // 检查是否是右箭头键(键码39)
            if (event.key === 'ArrowRight') {
                that.saveImg()
            }
        });
        window.addEventListener('beforeunload', function (event) {
            let str = '您确定要离开该页面吗？'
            if (that.autoDelete) {
                str = 'deleteImgs文件夹下所有图片已清除'
                that.delete(that.origin)
            }
            event.returnValue = str;
            return str;
        });
    },
    methods: {
        // 选取源文件夹
        async chooseOrigin() {
            const that = this
            try {
                // showOpenFilePicker()选择文件
                if ('showDirectoryPicker' in window) {
                    const handle = await window.showDirectoryPicker();
                    const root = await that.foreachDir(handle);
                    that.origin = root
                    that.directoryHandle = handle
                    that.handleImgArr(root)
                    const saveDir = await that.directoryHandle.getDirectoryHandle('savedImgs', { create: true });
                    const delDir = await that.directoryHandle.getDirectoryHandle('deleteImgs', { create: true });
                    let delDirFileCount = 0;
                    let saveDirFileCount = 0;
                    console.log(saveDir, delDir)
                    if (saveDir) {
                        // 遍历目录中的条目
                        for await (const entry of saveDir.values()) {
                            if (entry.kind === 'file') {
                                saveDirFileCount++; // 如果是文件，则计数增加
                            }
                        }
                    }
                    if (delDir) {
                        that.passNum = saveDirFileCount
                        // 遍历目录中的条目
                        for await (const entry of delDir.values()) {
                            if (entry.kind === 'file') {
                                delDirFileCount++; // 如果是文件，则计数增加
                            }
                        }
                    }
                    that.failNum = delDirFileCount
                    that.handleNum = saveDirFileCount + delDirFileCount
                } else {
                    alert('当前浏览器不支持 showDirectoryPicker 方法,推荐使用edge浏览器或者chrome浏览器');
                    console.error('当前浏览器不支持 showDirectoryPicker 方法');
                }
            } catch (error) {
                console.error('调用 showDirectoryPicker 时发生错误', error);
                alert('本项目需要您提供源目录才能正常运作,请重新选择源文件夹')
            }
        },
        // 处理文件夹句柄
        async foreachDir(handle) {
            const that = this
            if (handle.kind === 'file') {
                return handle;
            }
            handle.children = []
            // 如果是目录，就遍历目录下的文件和子目录
            const iter = handle.entries()
            for await (const item of iter) {
                handle.children.push(await that.foreachDir(item[1]))
            }
            return handle;
        },
        // 获取图片句柄
        async handleImgArr(root) {
            const that = this;
            let imgArrHandles = [];
            let imgHandle = [];
            let imageCount = 0;

            // 首先统计图片文件数量
            for (let item of root.children) {
                if (item.kind === 'file') {
                    const file = await item.getFile();
                    if (file.type.match('image.*')) {
                        imageCount++;
                    }
                }
            }

            // 如果图片文件超过200，则强制开启性能模式
            that.turbo = imageCount > 200;
            that.noHandleNum = imageCount;
            // 根据性能模式加载不同数量的图片
            for (let [index, item] of root.children.entries()) {
                if (item.kind === 'file') {
                    if ((!that.turbo || index < 20)) {
                        imgArrHandles.push(item.getFile());
                        imgHandle.push(item);
                    }
                }
            }

            // 句柄单独存储，方便后续文件操作
            that.swiperHandle = imgHandle;

            // 对文件句柄中每个文件进行操作
            that.loading = true;
            try {
                const files = await Promise.all(imgArrHandles.map((fileHandle) => fileHandle));
                let imgPromises = files.map((file) => {
                    if (file.type.match('image.*')) {
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target.result);
                            reader.onerror = (e) => {
                                console.error("文件读取出错", e);
                                reject(e);
                            };
                            reader.readAsDataURL(file);
                        });
                    }
                    return Promise.resolve(null);
                });

                // 等待所有文件处理完毕后更新swiperList
                const values = await Promise.all(imgPromises);
                that.swiperList = values.filter((value) => value !== null);
                if (that.swiperList.length < 1) {
                    alert('该目录中没有图片,请重新选择源文件夹');
                }
            } catch (error) {
                console.error('转换文件失败', error);
            } finally {
                that.loading = false;
            }
        },
        // 选择预览的图片
        chooseImg(index) {
            this.curImgIndex = index
        },
        // 保存图片到savedImgs文件夹
        async saveImg() {
            const that = this;
            try {
                const fileHandle = that.swiperHandle[that.curImgIndex]; // 原始文件句柄
                const file = await fileHandle.getFile(); // 获取文件对象
                const saveDir = await that.directoryHandle.getDirectoryHandle('savedImgs', { create: true });
                const newFileHandle = await saveDir.getFileHandle(file.name, { create: true });
                const writableStream = await newFileHandle.createWritable();
                await writableStream.write(file);
                await writableStream.close();

                // 删除操作: 下面的try-catch是为了确保即使删除失败，用户也能获得保存成功的提示。
                try {
                    // 针对支持删除操作的平台，进行文件删除
                    await fileHandle.remove(); // 删除原文件来模拟移动
                    that.refreshPage()
                    that.passNum += 1

                } catch (e) {
                    // 如果浏览器不支持删除文件，或者用户没有授予权限，抑或其他原因导致删除失败的话，就会进入这里。
                    console.error('删除原图片时出错: ', e);
                    // 这里可以不用alert给用户错误提示，因为文件已经复制成功。
                }

                // 弹出提示
            } catch (e) {
                console.error('移动图片时出错', e);
                alert('移动图片时出错');
            }
        },

        // 删除图片到deleteImgs文件夹
        async deleteImg() {
            const that = this;
            try {
                const fileHandle = that.swiperHandle[that.curImgIndex]; // 原始文件句柄
                const file = await fileHandle.getFile(); // 获取文件对象
                const deleteDir = await that.directoryHandle.getDirectoryHandle('deleteImgs', { create: true });
                const newFileHandle = await deleteDir.getFileHandle(file.name, { create: true });
                const writableStream = await newFileHandle.createWritable();
                await writableStream.write(file);
                await writableStream.close();
                // 删除操作: 下面的try-catch是为了确保即使删除失败，用户也能获得保存成功的提示。
                try {
                    // 针对支持删除操作的平台，进行文件删除
                    await fileHandle.remove(); // 删除原文件来模拟移动
                    console.log('源文件已删除');
                    that.refreshPage()
                    that.failNum += 1
                } catch (e) {
                    // 如果浏览器不支持删除文件，或者用户没有授予权限，抑或其他原因导致删除失败的话，就会进入这里。
                    console.error('删除原图片时出错: ', e);
                }
            } catch (e) {
                console.error('移动图片时出错', e);
                alert('移动图片时出错');
            }
        },
        // 刷新所有句柄
        refreshPage() {
            const that = this;
            that.handleNum += 1
            // 我们需要重新遍历 directoryHandle 中文件夹的内容
            that.foreachDir(that.directoryHandle).then(root => {
                that.origin = root; // 更新 origin 对象
                // 处理新的文件数组，并且重新生成 swiperList 和 swiperHandle
                that.handleImgArr(root);
            }).catch(error => {
                console.error('刷新页面时遍历目录出错', error);
                alert('刷新页面数据失败');
            });
        },
        async delete(handle) {
            const that = this;
            try {
                // 获取deleteImgs目录的句柄
                const deleteImgsDirHandle = await handle.getDirectoryHandle('deleteImgs');
                // 遍历deleteImgs目录删除文件
                for await (const entry of deleteImgsDirHandle.values()) {
                    if (entry.kind === 'file') {
                        // 确定条目是文件
                        console.log(`正在删除: ${entry.name}`);
                        await deleteImgsDirHandle.removeEntry(entry.name);
                        console.log(`${entry.name} 已被删除`);
                    }
                }
                console.log('deleteImgs目录下的所有图片已经删除');
            } catch (error) {
                console.error('删除deleteImgs目录下的图片时发生错误: ', error);
            }
        }
    },
    beforeDestroy() {
        clearInterval(this.interval);
        this.delete(this.origin)
    }

}).mount('#app');