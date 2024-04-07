const { createApp } = Vue;
createApp({
    data() {
        return {
            origin: {},
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
            privacyMode: false,//隐私模式
            dialogMsg: "这是一个弹框",
            dialogVisible: false,
            version: "V0.2.2",
            tips: [
                "点击红色按钮、←键、Ctrl+S，还行、留着",
                "点击白色按钮、→键、Ctrl+D，腊鸡、删掉",
                "Ctrl+Z，删错了？手滑了？给我回来！刷新页面、处理完毕时失效！",
                "Mac用户用Meta键+S、Meta键+D、Meta键+Z",
                '点击源目录名称更换源目录',
                "'~'键打开隐私模式,一键模糊所有图片"
            ],
            warning: [
                "deleteImgs下的图片会在筛选完最后一张图时清空",
                "本项目仅供学习交流，完全免费，<a href='https://github.com/longhaolh/sd_img_filter.git' target='_blank'>项目已开源，欢迎star</a>",
                '所有图片均为本地处理,不会上传到任何服务器',
                "本项目使用技术尚在研究阶段,大部分浏览器不支持此API,推荐使用<a href='https://www.microsoft.com/zh-cn/edge' target='_blank'>Edge浏览器</a>和<a href='https://www.google.cn/intl/zh-CN/chrome/' target='_blank'>Chrome浏览器</a>",
                '如上面所言，本项目使用的是尚在研发中的API，所以可能会有一些小bug，请您谅解，如您在使用中遇见了，可以联系我。',
                '使用中遇见问题可将遇见的问题发送至邮箱: <a href="mailto:1522024324@qq.com">1522024324@qq.com</a>',
                "<a href='https://qm.qq.com/q/r143Zn6GSA' target='_blank'>点击加入QQ交流群：675037961</a>",
                "如果觉得本项目对您有帮助,可以<a href='https://longhao.tech/donation' target='_blank'>请我喝杯咖啡</a>,谢谢您的支持",
            ],
            noOiginTip: [
                "<p class='warn'>本项目基于File System Access API开发,目前只有<a href='https://www.microsoft.com/zh-cn/edge' target='_blank'>Edge浏览器</a>和<a href='https://www.google.cn/intl/zh-CN/chrome/' target='_blank'>Chrome浏览器</a>对此技术支持尚可,如遇问题请先下载这两种浏览器尝试一下</p>",
                "<p class='warn'>本项目旨在为SD处理大量图片提供便利，只适配了PC端浏览器，移动端浏览器可能会出现不可预知的问题，建议使用PC端浏览器访问</p>",
                '第一步：点击按钮选择源目录（仅支持处理图片）',
                "第二步：弹出的授权按钮点击'查看文件'和'保存更改'，授权浏览器访问本地文件系统",
                '第三步：选择源目录后，会自动加载源目录下的所有图片文件',
            ],
            option: false,
            historyStack: [],
            showInstallBtn: false,
            isPWA: false,
            deferredPrompt: null,
            notice: "本站新增PWA安装功能,可以作为PWA应用安装到电脑桌面,不用打开浏览器即可使用,仅支持<a href='https://www.microsoft.com/zh-cn/edge' target='_blank'>Edge浏览器</a>和<a href='https://www.google.cn/intl/zh-CN/chrome/' target='_blank'>Chrome浏览器</a>安装，点击下方安装按钮即可一键安装，没有按钮请更换浏览器再试试吧！"
        }
    },
    watch: {
        autoDelete(n) {
            localStorage.setItem('autoDelete', n)
        },
        turbo(n) {
            localStorage.setItem('turbo', n)
        }
    },
    mounted() {
        const that = this
        // 读取本地配置文件
        that.readCofig()
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
        that.isPWAMode()
        that.isEdgeOrChrome()
        if ("onbeforeinstallprompt" in window) {
            window.addEventListener("beforeinstallprompt", (e) => {
                // 防止Chrome 67及更早版本自动显示安装提示
                e.preventDefault();
                // 缓存事件以便稍后触发
                that.deferredPrompt = e;
            });

        } else {
            console.warn('浏览器不支持PWA');
            that.showInstallBtn = false
            that.isPWA = false
        }


        // 快捷键设置
        document.addEventListener('keydown', function (event) {
            // 检查 ` 键是否被按下 
            if (event.key === '`') {
                that.privacyMode = !that.privacyMode
            }
            // 检查是否是左箭头键(键码37)
            if (event.key === 'ArrowLeft') {
                that.swiperList.length < 1 ? '' : that.deleteImg()
            }
            // 检查是否是右箭头键(键码39)
            if (event.key === 'ArrowRight') {
                that.swiperList.length < 1 ? '' : that.saveImg()
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault(); // 阻止浏览器默认行为
                // 调用自定义的保存图片函数
                that.saveImg();
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault(); // 阻止浏览器默认行为
                // 调用自定义的删除函数
                that.deleteImg();
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault(); // 阻止浏览器默认行为
                // 调用自定义的撤销函数
                that.undoAction();
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
        // 读取配置
        readCofig() {
            this.autoDelete = localStorage.getItem('autoDelete') === 'true'
            this.turbo = localStorage.getItem('turbo') === 'true'
        },
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
                    alert('当前浏览器不支持FileSystemAPI,推荐使用edge浏览器或者chrome浏览器');
                    console.error('当前浏览器不支持 showDirectoryPicker 方法');
                }
            } catch (error) {
                alert("本项目需要您提供文件权限才能正常运作,请选择'保存更改'选项")
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

            // 如果图片文件超过50，则强制开启性能模式
            if (!that.turbo) {
                that.turbo = imageCount > 50;
            }
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
            !that.turbo ? that.loading = true : ''
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
            // 防止在上一个保存操作未完成时触发
            const that = this;
            if (that.option) return;
            that.option = true;
            try {
                const fileHandle = that.swiperHandle[that.curImgIndex]; // 原始文件句柄
                const file = await fileHandle.getFile(); // 获取文件对象
                const saveDir = await that.directoryHandle.getDirectoryHandle('savedImgs', { create: true });
                const newFileHandle = await saveDir.getFileHandle(file.name, { create: true });
                const writableStream = await newFileHandle.createWritable();
                await writableStream.write(file);
                await writableStream.close();
                that.recordHistory(fileHandle, 'save'); // 记录保存操作
                // 删除操作: 下面的try-catch是为了确保即使删除失败，用户也能获得保存成功的提示。
                try {
                    // 针对支持删除操作的平台，进行文件删除
                    await fileHandle.remove(); // 删除原文件来模拟移动
                    that.refreshPage()
                    that.passNum += 1

                } catch (e) {
                    // 如果浏览器不支持删除文件，或者用户没有授予权限，抑或其他原因导致删除失败的话，就会进入这里。
                    console.error('删除原图片时出错: ', e);
                }
            } catch (e) {
                alert("本项目需要您提供文件权限才能正常运作,请选择'保存更改'选项")
                console.log('保存图片时出错: ', e);

            } finally {
                that.option = false;
            }
        },
        // 删除图片到deleteImgs文件夹
        async deleteImg() {
            // 防止在上一个删除操作未完成时触发
            const that = this;
            if (that.option) return;
            that.option = true;
            try {
                const fileHandle = that.swiperHandle[that.curImgIndex]; // 原始文件句柄
                const file = await fileHandle.getFile(); // 获取文件对象
                const deleteDir = await that.directoryHandle.getDirectoryHandle('deleteImgs', { create: true });
                const newFileHandle = await deleteDir.getFileHandle(file.name, { create: true });
                const writableStream = await newFileHandle.createWritable();
                await writableStream.write(file);
                await writableStream.close();
                that.recordHistory(fileHandle, 'delete'); // 记录删除操作
                // 删除操作: 下面的try-catch是为了确保即使删除失败，用户也能获得保存成功的提示。
                try {
                    // 针对支持删除操作的平台，进行文件删除
                    await fileHandle.remove(); // 删除原文件来模拟移动
                    console.log('源文件已删除');
                    that.refreshPage()
                    that.failNum += 1
                } catch (e) {
                    console.error('删除原图片时出错: ', e);
                }
            } catch (e) {
                alert("本项目需要您提供文件权限才能正常运作,请选择'保存更改'选项")
            } finally {
                that.option = false;
            }
        },
        // 修改 copyAndDeleteSavedImages 方法以复制和删除 savedImgs 文件夹
        async copyAndDeleteSavedImages(rootHandle) {
            this.loading
            try {
                const savedImgsDirHandle = await rootHandle.getDirectoryHandle('savedImgs', { create: false });
                let copyPromises = [];
                for await (const entry of savedImgsDirHandle.values()) {
                    if (entry.kind === 'file') {
                        // 复制文件内容到根目录
                        const file = await entry.getFile();
                        const newFileHandle = await rootHandle.getFileHandle(file.name, { create: true });
                        const writableStream = await newFileHandle.createWritable();
                        copyPromises.push(writableStream.write(file).then(() => writableStream.close()));
                    }
                }
                await Promise.all(copyPromises);
                // 删除整个 savedImgs 文件夹
                await rootHandle.removeEntry('savedImgs', { recursive: true });
            } catch (error) {
                console.error('复制或删除 savedImgs 目录时出错: ', error);
                throw error;
            }
        },
        //重新处理源文件夹根句柄
        refreshPage() {
            const that = this;
            that.handleNum += 1
            that.foreachDir(that.directoryHandle).then(async updatedRootHandle => {
                that.origin = updatedRootHandle; // 更新 origin 对象
                // 检查根目录下是否只存在 savedImgs、deleteImgs 文件夹和非图片文件
                let onlySpecialDirsAndNonImageFilesExist = true;
                for (const child of updatedRootHandle.children) {
                    // 检查是否只有savedImgs 和 deleteImgs文件夹
                    if (child.kind === 'directory' &&
                        !['savedImgs', 'deleteImgs'].includes(child.name)) {
                        onlySpecialDirsAndNonImageFilesExist = false;
                        break;
                    }
                    if (child.kind === 'file') {
                        const file = await child.getFile();
                        if (file.type.match('image.*')) {
                            // 如果文件是图片类型，则不满足条件
                            onlySpecialDirsAndNonImageFilesExist = false;
                            break;
                        }
                    }
                }
                if (onlySpecialDirsAndNonImageFilesExist) {
                    // 初始化界面变量
                    alert(`太棒了!本次图片已经筛选完毕了,一共处理了${that.handleNum}张图片,清除了${that.failNum}张废图，继续清理请重新选择源文件夹`)
                    that.origin = {}
                    that.swiperList = that.swiperHandle = []
                    that.curImgIndex = 0
                    that.handleNum = that.noHandleNum = that.passNum = that.failNum = 0
                    that.privacyMode = false
                    // 如果满足条件，执行复制和删除 savedImgs 中的图片，然后删除 savedImgs 和 deleteImgs 文件夹
                    await that.copyAndDeleteSavedImages(updatedRootHandle);
                    // 删除 deleteImgs 文件夹及其内容
                    await updatedRootHandle.removeEntry('deleteImgs', { recursive: true });
                } else {
                    // 否则继续处理新的文件数组，并且重新生成 swiperList 和 swiperHandle
                    await that.handleImgArr(updatedRootHandle);
                }
            }).catch(error => {
                console.error('刷新页面时遍历目录出错', error);
            });
        },
        // 删除操作
        async delete(handle) {
            const that = this;
            try {
                // 获取deleteImgs目录的句柄
                const deleteImgsDirHandle = await handle.getDirectoryHandle('deleteImgs');
                if (!deleteImgsDirHandle) {
                    return
                }
                // 遍历deleteImgs目录删除文件
                for await (const entry of deleteImgsDirHandle.values()) {
                    if (entry.kind === 'file') {
                        // 确定条目是文件
                        await deleteImgsDirHandle.removeEntry(entry.name);
                    }
                }
                console.log('deleteImgs目录下的所有图片已经删除');
            } catch (error) {
                console.error('删除deleteImgs目录下的图片时发生错误: ', error);
            }
        },
        // 记录操作到历史栈中
        recordHistory(fileHandle, actionType) {
            if (this.historyStack.length >= 10) {
                this.historyStack.shift(); // 确保栈的最大长度不超过10
            }
            this.historyStack.push({ fileHandle, actionType });
        },
        // 撤销操作
        async undoAction() {
            if (this.historyStack.length === 0) {
                alert("没有可撤销的操作");
                return;
            }
            const lastOperation = this.historyStack.pop();
            if (lastOperation.actionType === 'save') {
                await this.undoSave(lastOperation.fileHandle);
            } else if (lastOperation.actionType === 'delete') {
                await this.undoDelete(lastOperation.fileHandle);
            }
        },
        // 实际执行撤销保存操作的方法
        async undoSave(fileHandle) {
            // 将保存的文件移回到原始位置...
            // 撤销保存就是将图片从savedImgs目录移动回原目录
            try {
                const saveDirHandle = await this.directoryHandle.getDirectoryHandle('savedImgs', { create: false });
                const file = await saveDirHandle.getFileHandle(fileHandle.name, { create: false });
                await this.moveFile(file, this.directoryHandle);
                // 刷新图片列表
                this.refreshPage();
            } catch (error) {
                console.error("撤销保存操作失败:", error);
                alert("撤销保存失败！");
            }
        },
        // 实际执行撤销删除操作的方法
        async undoDelete(fileHandle) {
            // 将删除的文件移回到原始位置...
            // 撤销删除就是将图片从deleteImgs目录移动回原目录
            try {
                const deleteDirHandle = await this.directoryHandle.getDirectoryHandle('deleteImgs', { create: false });
                const file = await deleteDirHandle.getFileHandle(fileHandle.name, { create: false });
                await this.moveFile(file, this.directoryHandle);
                // 刷新图片列表
                this.refreshPage();
            } catch (error) {
                console.error("撤销删除操作失败:", error);
                alert("撤销删除失败！");
            }
        },
        // 文件移动函数，从sourceDir移动到targetDir
        async moveFile(fileHandle, targetDir) {
            const file = await fileHandle.getFile();
            const newHandle = await targetDir.getFileHandle(file.name, { create: true });
            const writable = await newHandle.createWritable();
            await writable.write(file);
            await writable.close();
            await fileHandle.remove(); // 移动后删除原文件
        },
        // 读取图片的Exif信息，并提取SD标签信息
        async readImageExif(file) {
            const that = this;
            try {
                EXIF.getData(file, function () {
                    // 获取ImageDescription信息
                    const imageDescription = EXIF.getTag(this, "ImageDescription");

                    // 检查是否有描述标签，如果有，则处理和展示它
                    if (imageDescription) {
                        console.log(imageDescription);
                        // 处理字符串提取所需的标签信息
                        const tags = that.parseSDTags(imageDescription);

                        // 逻辑处理，如显示到界面
                        // 这里可以根据需要将tags显示到应用的某个部分
                        alert(tags); // 示例：弹出显示标签信息
                    } else {
                        // 如果没有找到标签信息，给出提示
                        console.log('无法找到图片的描述标签信息。');
                    }
                });
            } catch (error) {
                console.error('读取Exif信息出错:', error);
            }
        },
        // 将SD信息字符串解析成标签，这里根据实际格式定制解析逻辑
        parseSDTags(description) {
            // 以下是示例逻辑，具体解析规则根据实际情况定制
            // 假设SD的标签以逗号分隔
            const tags = description.split(',');
            return tags.map(tag => tag.trim()); // 去除前后空格
        },
        // 安装网站到桌面
        installApp() {
            const that = this
            // 显示安装提示
            that.deferredPrompt.prompt();
            // 等待用户响应用户提示
            that.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === "accepted") {
                    console.log("用户接受安装");
                } else {
                    console.log("用户拒绝安装");
                }
                deferredPrompt = null;
            });
        },
        // 判断当前是否为PWA环境
        isPWAMode() {
            // 检查是否在iOS Safari中以PWA模式运行
            if (window.navigator.standalone) {
                this.isPWA = true
                return true
            }
            // 检查是否在其他支持PWA的浏览器中以standalone模式运行
            if (window.matchMedia('(display-mode: standalone)').matches) {
                this.isPWA = true
                return true
            }
            // 不在PWA模式下
            this.isPWA = false
        },
        //  检查当前浏览器是否为Chrome或Edge。
        isEdgeOrChrome() {
            // 获取浏览器的用户代理字符串
            const userAgent = navigator.userAgent;
            // 判断用户代理字符串是否符合Chrome或Edge的格式
            const isChrome = (
                /Chrome\/[0-9.]+/.test(userAgent) || /Edg\/[0-9.]+/.test(userAgent)
            );
            // 在控制台输出判断结果
            this.showInstallBtn = isChrome
            console.log('当前浏览器是否为Chrome或Edge：', isChrome);

        }
    },
    beforeDestroy() {
        this.delete(this.origin)
    }

}).mount('#app');