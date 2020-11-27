(function () {
    const OPTIONS = {
        STEP: 60,
        SIZE: [30, 50],
        SPEED: [10, 10]
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
        getEl() {
            const parent = selector ? root : document;
            return parent.querySelector(selector)
        },
        getEls(selector, root = document) {
            return [...root.querySelectorAll(selector)];
        },
        createEl(str) {
            // may cause leaks
            const template = document.createElement('template');
            template.innerHTML = str.trim();
            return template.content.firstChild;
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
            this.$board = DOM.byId("board");
            this.$form = DOM.byId("controls");
            this.$input = DOM.byId("circles");
            this.$pause = DOM.byId("pause");
            this.$play = DOM.byId("play");
            this.$clear = DOM.byId("clear");
            this.onAction = this.onAction.bind(this);
            this.$form.addEventListener("submit", this.onAction);

            this.$play.style.display = "none";
            this.$pause.style.display = "none";
            this.$clear.style.display = "none";
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
                default:
                    break;
            }
        }
        handleRender() {
            this.handleClear();
            this.setup();
            this.handlePlay();
        }
        handlePlay() {
            this.$play.style.display = "none";
            this.$pause.style.display = "inline-block";
            this.$clear.style.display = "inline-block";
            this.interval = setInterval(() => {
                this.loop();
            }, OPTIONS.STEP)
        }
        handlePause() {
            this.$pause.style.display = "none";
            this.$play.style.display = "inline-block";
            clearInterval(this.interval);
        }
        handleClear() {
            clearInterval(this.interval);
            this.$clear.style.display = "none";
            this.$play.style.display = "none";
            this.$pause.style.display = "none";
            this.Circles.forEach((circle) => {
                circle.destroy();
            });
            this.Circles = [];
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
            this.$board = $board;
            this.isBlocked = false;
            this.color = RND.getColor();
            this.size = RND.getInt(
                OPTIONS.SIZE[0],
                OPTIONS.SIZE[1]
            );
            this.dSize = Math.floor(this.size / 2);
            this.speed = RND.getInt(
                OPTIONS.SPEED[0],
                OPTIONS.SPEED[1]
            );
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
            this.onMouseEnter = this.onMouseEnter.bind(this);
            this.render();
        }
        getBounds() {
            const styles = window.getComputedStyle(this.$board);
            return {
                x: {
                    min: 0 + this.dSize,
                    max: parseInt(styles.height) - this.dSize
                },
                y: {
                    min: 0 + this.dSize,
                    max: parseInt(styles.width) - this.dSize
                }
            };
        }
        getCircleStyle() {
            return [
                `background-color: #${this.color}`,
                `width: ${this.size}px`,
                `height: ${this.size}px`,
                `top: ${this.Vpos.x}px`,
                `left: ${this.Vpos.y}px`,
                `transform: translate(${-this.dSize}px, ${-this.dSize}px)`
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
            this.$el.addEventListener("mouseenter", this.onMouseEnter);
        }
        destroy() {
            this.$el.removeEventListener("click", this.onClick);
            this.$el.removeEventListener("mouseenter", this.onMouseEnter);
            this.$board.removeChild(this.$el);
        }
        onClick(event) {
            this.isBlocked = !this.isBlocked;
        }
        onMouseEnter(event) {
            this.isBlocked = true;
            this.color = RND.getColor();
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
                    this.speed
                )
            );
            this.check();
        }
        draw() {
            this.$el.style.top = `${this.Vpos.x}px`;
            this.$el.style.left = `${this.Vpos.y}px`;
            this.$el.style.backgroundColor = `#${this.color}`;
        }
    }
    document.addEventListener("DOMContentLoaded", (e) => {
        new Board();
    });
})()