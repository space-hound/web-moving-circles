(function () {
    const OPTIONS = {
        STEP: 1000 / 60,
        SIZE: [15, 50],
        SPEED: [3, 9]
    };
    const RND = {
        getInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        getBinary() {
            const random = this.getInt(1, 100);
            return random <= 50 ? 1 : -1;
        },
        getColor() {
            const parts = "0123456789ABCDEF";
            return [...new Array(6)].map(() => {
                return parts[
                    this.getInt(0, parts.length - 1)
                ];
            }).join("");
        }
    }
    const DOM = {
        byId(id) {
            return document.getElementById(id);
        },
        getEl(selector, root = document) {
            return root.querySelector(selector)
        },
        getEls(selector, root = document) {
            return [...root.querySelectorAll(selector)];
        },
        _template: null,
        createEl(str) {
            if (!this._template) {
                this._template = document.createElement('template');
            }
            this._template.innerHTML = str.trim();
            return this._template.content.firstChild;
        }
    };
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        add(v) {
            return new Vector(
                this.x + v.x,
                this.y + v.y
            );
        }
        scale(l) {
            return new Vector(
                this.x * l,
                this.y * l
            );
        }
    }
    class Board {
        constructor() {
            this.circles = [];
            this.interval = null;
            /*--------------------------------------------------------*/
            this.$board = DOM.byId("board");
            this.$form = DOM.byId("controls");
            this.$input = DOM.byId("circles");
            this.$pause = DOM.byId("pause");
            this.$play = DOM.byId("play");
            this.$clear = DOM.byId("clear");
            this.$recolor = DOM.byId("recolor");
            this.$redirect = DOM.byId("redirect");
            this.$speed = DOM.byId("speed");
            this.$speedlabel = DOM.getEl("label[for=speed]");
            this.$size = DOM.byId("size");
            this.$sizelabel = DOM.getEl("label[for=size]");
            /*--------------------------------------------------------*/
            this.$play.style.display = "none";
            this.$pause.style.display = "none";
            this.$clear.style.display = "none";
            this.$recolor.style.display = "none";
            this.$redirect.style.display = "none";
            this.$speed.style.display = "none";
            this.$speedlabel.style.display = "none";
            this.$size.style.display = "none";
            this.$sizelabel.style.display = "none";
            /*--------------------------------------------------------*/
            this.onAction = this.onAction.bind(this);
            this.onSpeedChage = this.onSpeedChage.bind(this);
            this.onSizeChange = this.onSizeChange.bind(this);
            this.onBoardSizeChange = this.onBoardSizeChange.bind(this);
            /*--------------------------------------------------------*/
            this.$form.addEventListener("submit", this.onAction);
            this.$speed.addEventListener("input", this.onSpeedChage);
            this.$size.addEventListener("input", this.onSizeChange);
            /*--------------------------------------------------------*/
            this.boundsobserver = new ResizeObserver(this.onBoardSizeChange);
            this.boundsobserver.observe(this.$board);
            DOM.getEl("#container").style.pointerEvents = "auto"
        }
        get CirclesLength() {
            return parseInt(this.$input.value) || 0;
        }
        get Circles() {
            return this.circles;
        }
        set Circles(circles) {
            this.circles = circles;
        }
        onAction(event) {
            event.preventDefault();
            const type = event.submitter.id;
            switch (type) {
                case "render": this.handleRender();
                    break;
                case "play": this.handlePlay();
                    break;
                case "pause": this.handlePause();
                    break;
                case "clear": this.handleClear();
                    break;
                case "recolor": this.handleRecolor();
                    break;
                case "redirect": this.handleRedirect();
                    break;
                default:
                    break;
            }
        }
        onSpeedChage(event) {
            const value = parseInt(this.$speed.value);
            this.circles.forEach((circle) => {
                circle.modSpeed(value);
            });
        }
        onSizeChange(event) {
            const value = parseInt(this.$size.value);
            this.circles.forEach((circle) => {
                circle.modSize(value);
            });
        }
        onBoardSizeChange(event) {
            this.circles.forEach((circle) => {
                circle.rebound();
            });
        }
        handleRender() {
            this.handleClear();
            this.setup();
            this.handlePlay();
        }
        handlePlay() {
            /*--------------------------------------------------------*/
            this.$play.style.display = "none";
            this.$pause.style.display = "inline-block";
            this.$clear.style.display = "inline-block";
            this.$recolor.style.display = "inline-block";
            this.$redirect.style.display = "inline-block";
            this.$speed.style.display = "inline-block";
            this.$speedlabel.style.display = "inline-block";
            this.$size.style.display = "inline-block";
            this.$sizelabel.style.display = "inline-block";
            /*--------------------------------------------------------*/
            this.onBoardSizeChange();
            this.interval = setInterval(() => {
                this.loop();
            }, OPTIONS.STEP)
        }
        handlePause() {
            /*--------------------------------------------------------*/
            this.$pause.style.display = "none";
            this.$speed.style.display = "none";
            this.$speedlabel.style.display = "none";
            this.$size.style.display = "none";
            this.$sizelabel.style.display = "none";
            this.$redirect.style.display = "none";
            this.$play.style.display = "inline-block";
            /*--------------------------------------------------------*/
            clearInterval(this.interval);
        }
        handleClear() {
            /*--------------------------------------------------------*/
            this.$clear.style.display = "none";
            this.$recolor.style.display = "none";
            this.$redirect.style.display = "none";
            this.$play.style.display = "none";
            this.$pause.style.display = "none";
            this.$speed.style.display = "none";
            this.$speedlabel.style.display = "none";
            this.$size.style.display = "none";
            this.$sizelabel.style.display = "none";
            /*--------------------------------------------------------*/
            clearInterval(this.interval);
            this.Circles.forEach((circle) => {
                circle.destroy();
            });
            this.Circles = [];
        }
        handleRecolor() {
            this.circles.forEach((circle) => {
                circle.recolor();
                circle.draw();
            });
        }
        handleRedirect() {
            this.circles.forEach((circle) => {
                circle.redirect();
            });
        }
        setup() {
            this.Circles = [
                ...new Array(this.CirclesLength)
            ].map(() => new Circle(this.$board));
        }
        loop() {
            this.Circles.forEach((circle) => {
                circle.move();
                circle.draw();
            });
        }
    }
    class Circle {
        constructor($board) {
            this.$el = null;
            this.$board = $board;
            this.isBlocked = false;
            this.color = RND.getColor();
            this.size = RND.getInt(
                OPTIONS.SIZE[0],
                OPTIONS.SIZE[1]
            );
            this.dSize = this.size;
            this.hSize = Math.floor(this.dSize / 2);
            this.speed = RND.getInt(
                OPTIONS.SPEED[0],
                OPTIONS.SPEED[1]
            );
            this.dSpeed = this.speed;
            this.bounds = this.getBounds();
            this.Vpos = new Vector(
                RND.getInt(
                    this.bounds.x.min, this.bounds.x.max
                ),
                RND.getInt(
                    this.bounds.y.min, this.bounds.y.max
                )
            );
            this.Vdir = new Vector(
                RND.getBinary(),
                RND.getBinary()
            );
            this.onClick = this.onClick.bind(this);
            this.render();
        }
        getBounds() {
            const styles = window.getComputedStyle(this.$board);
            return {
                x: {
                    min: 0 + this.hSize,
                    max: parseInt(styles.height) - this.hSize
                },
                y: {
                    min: 0 + this.hSize,
                    max: parseInt(styles.width) - this.hSize
                }
            };
        }
        getCircleStyle() {
            return [
                `background-color: #${this.color}`,
                `width: ${this.dSize}px`,
                `height: ${this.dSize}px`,
                `top: ${this.Vpos.x}px`,
                `left: ${this.Vpos.y}px`,
                `transform: translate(${-this.hSize}px, ${-this.hSize}px)`
            ].join(";");
        }
        render() {
            const template = `
                <div class="circle" style="${this.getCircleStyle()}">
                </div>
            `;
            this.$el = DOM.createEl(template);
            this.$board.insertAdjacentElement('afterbegin', this.$el);
            this.$el.addEventListener("click", this.onClick);
        }
        destroy() {
            this.$el.removeEventListener("click", this.onClick);
            this.$board.removeChild(this.$el);
        }
        onClick(event) {
            this.isBlocked = !this.isBlocked;
            this.recolor();
        }
        modSpeed(value) {
            const delta = this.speed * (value / 100);
            this.dSpeed = this.speed + delta;
        }
        modSize(value) {
            const delta = this.size * (value / 100);
            this.dSize = Math.floor(this.size + delta);
            this.hSize = Math.floor(this.dSize / 2);
            this.rebound();
        }
        recolor() {
            this.color = RND.getColor();
        }
        redirect() {
            this.Vdir = new Vector(
                RND.getBinary(),
                RND.getBinary()
            );
        }
        rebound() {
            this.bounds = this.getBounds();
        }
        check() {
            if (this.Vpos.x <= this.bounds.x.min) {
                this.Vpos.x = this.bounds.x.min;
                this.Vdir.x *= -1;
            }
            if (this.Vpos.x >= this.bounds.x.max) {
                this.Vpos.x = this.bounds.x.max;
                this.Vdir.x *= -1;
            }
            if (this.Vpos.y <= this.bounds.y.min) {
                this.Vpos.y = this.bounds.y.min;
                this.Vdir.y *= -1;
            }
            if (this.Vpos.y >= this.bounds.y.max) {
                this.Vpos.y = this.bounds.y.max;
                this.Vdir.y *= -1;
            }
        }
        move() {
            if (this.isBlocked) return;
            this.Vpos = this.Vpos.add(
                this.Vdir.scale(
                    this.dSpeed
                )
            );
            this.check();
        }
        draw() {
            /*
                this.$el.style.top = `${this.Vpos.x}px`;
                this.$el.style.left = `${this.Vpos.y}px`;
                this.$el.style.backgroundColor = `#${this.color}`;
            */
            this.$el.style.cssText = this.getCircleStyle();
        }
    }
    document.addEventListener("DOMContentLoaded", (e) => {
        new Board();
    });
})()