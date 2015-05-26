$('#canvas').after($('#canvas').clone().attr('id','canvas-2')).remove();
(function(f, l) {
    function Da() {
        la();
        setInterval(la, 18E4);
        z = ba = document.getElementById("canvas-2");
        e = z.getContext("2d");
        z.onmousedown = function(a) {
            if (ma) {
                var b = a.clientX - (5 + p / 5 / 2),
                    c = a.clientY - (5 + p / 5 / 2);
                if (Math.sqrt(b * b + c * c) <= p / 5 / 2) {
                    H();
                    A(17);
                    return
                }
            }
            O = a.clientX;
            P = a.clientY;
            ca();
            H()
        };
        z.onmousemove = function(a) {
            O = a.clientX;
            P = a.clientY;
            ca()
        };
        z.onmouseup = function(a) {};
        var a = !1,
            b = !1,
            c = !1;
        f.onkeydown = function(d) {
            32 != d.keyCode || a || (H(), A(17), a = !0);
            81 != d.keyCode || b || (A(18), b = !0);
            87 != d.keyCode || c || (H(), A(21), c = !0);
if(d.keyCode == 72) { if(g.length > 0 && confirm("Sure to bug?")) g[0].ox = Number.POSITIVE_INFINITY; };
            27 == d.keyCode && na(!0)
        };
        f.onkeyup = function(d) {
            32 == d.keyCode && (a = !1);
            87 == d.keyCode && (c = !1);
            81 == d.keyCode && b && (A(19), b = !1)
        };
        f.onblur = function() {
            A(19);
            c = b = a = !1
        };
        f.onresize = oa;
        oa();
        f.requestAnimationFrame ? f.requestAnimationFrame(pa) : setInterval(da, 1E3 / 60);
        //setInterval(H, 40);
        qa(l("#region").val());
        l("#overlays").show()
    }

    function Ea() {
        if (.5 > h) I = null;
        else {
            for (var a = Number.POSITIVE_INFINITY, b = Number.POSITIVE_INFINITY, c = Number.NEGATIVE_INFINITY, d = Number.NEGATIVE_INFINITY, e = 0, k = 0; k < q.length; k++) q[k].shouldRender() && (e = Math.max(q[k].size, e), a = Math.min(q[k].x, a), b = Math.min(q[k].y, b), c = Math.max(q[k].x, c), d = Math.max(q[k].y, d));
            I = QUAD.init({
                minX: a - (e + 100),
                minY: b - (e + 100),
                maxX: c + (e + 100),
                maxY: d + (e + 100)
            });
            for (k = 0; k < q.length; k++)
                if (a = q[k], a.shouldRender())
                    for (b = 0; b < a.points.length; ++b) I.insert(a.points[b])
        }
    }

    function ca() {
        Q = (O - p / 2) / h + s;
        R = (P - r / 2) / h + t
    }

    function la() {
        null == S && (S = {}, l("#region").children().each(function() {
            var a = l(this),
                b = a.val();
            b && (S[b] = a.text())
        }));
        l.get("http://m.agar.io/info", function(a) {
            var b = {},
                c;
            for (c in a.regions) {
                var d =
                    c.split(":")[0];
                b[d] = b[d] || 0;
                b[d] += a.regions[c].numPlayers
            }
            for (c in b) l('#region option[value="' + c + '"]').text(S[c] + " (" + b[c] + " players)")
        }, "json")
    }

    function ra() {
        l("#adsBottom").hide();
        l("#overlays").hide()
    }

    function qa(a) {
        a && a != J && (J = a, ea())
    }

    function na(a) {
        Fa();
        l("#overlays").fadeIn(a ? 200 : 3E3);
        a || l("#adsBottom").fadeIn(3E3)
    }

    function Fa() {
        T && 3 == fa && (T = !1, setTimeout(function() {
            T = !0
        }, 3E5), googletag.pubads().refresh([f.mainAd]))
    }

    function sa() {
        console.log("Find " + J + K);
        l.ajax("http://m.agar.io/", {
            error: function() {
                setTimeout(sa, 1E3)
            },
            success: function(a) {
                a = a.split("\n");
				l('#ip-address').html(a[0])
                ta("ws://" + a[0])
            },
            dataType: "text",
            method: "POST",
            cache: !1,
            crossDomain: !0,
            data: J + K || "?"
        })
    }

    function ea() {
        J && (l("#connecting").show(), sa())
    }

    function ta(a) {
        if (m) {
            m.onopen = null;
            m.onmessage = null;
            m.onclose = null;
            try {
                m.close()
            } catch (b) {}
            m = null
        }
        B = [];
        g = [];
        w = {};
        q = [];
        C = [];
        y = [];
        x = u = null;
        D = 0;
        console.log("Connecting to " + a);
        m = new WebSocket(a);
        m.binaryType = "arraybuffer";
        m.onopen = Ga;
        m.onmessage = Ha;
        m.onclose = Ia;
        m.onerror = function() {
            console.log("socket error")
        }
    }

    function Ga(a) {
        U = 500;
        l("#connecting").hide();
        console.log("socket open");
        a = new ArrayBuffer(5);
        var b = new DataView(a);
        b.setUint8(0, 254);
        b.setUint32(1, 1, !0);
        m.send(a);
        a = new ArrayBuffer(5);
        b = new DataView(a);
        b.setUint8(0, 255);
        b.setUint32(1, 1, !0);
        m.send(a);
        ua()
    }

    function Ia(a) {
        console.log("socket close");
        setTimeout(ea, U);
        U *= 1.5
    }

    function Ha(a) {
        function b() {
            for (var a = "";;) {
                var b = d.getUint16(c, !0);
                c += 2;
                if (0 == b) break;
                a += String.fromCharCode(b)
            }
            return a
        }
        var c = 1,
            d = new DataView(a.data);
        switch (d.getUint8(0)) {
            case 16:
                Ja(d);
                break;
            case 17:
                L = d.getFloat32(1, !0);
                M = d.getFloat32(5, !0);
                N = d.getFloat32(9, !0);
                break;
            case 20:
                g = [];
                B = [];
                break;
            case 32:
                B.push(d.getUint32(1, !0));
                break;
            case 49:
                if (null != u) break;
                a = d.getUint32(c, !0);
                c += 4;
                y = [];
                for (var e = 0; e < a; ++e) {
                    var k = d.getUint32(c, !0),
                        c = c + 4;
                    y.push({
                        id: k,
                        name: b()
                    })
                }
                va();
                break;
            case 50:
                u = [];
                a = d.getUint32(c, !0);
                c += 4;
                for (e = 0; e < a; ++e) u.push(d.getFloat32(c, !0)), c += 4;
                va();
                break;
            case 64:
                V = d.getFloat64(1, !0), W = d.getFloat64(9, !0), X = d.getFloat64(17, !0), Y = d.getFloat64(25, !0), L = (X + V) / 2, M = (Y + W) / 2, N = 1, 0 == g.length && (s =
                    L, t = M, h = N)
        }
    }

    function Ja(a) {
        E = +new Date;
        var b = Math.random(),
            c = 1;
        ga = !1;
        for (var d = a.getUint16(c, !0), c = c + 2, e = 0; e < d; ++e) {
            var k = w[a.getUint32(c, !0)],
                f = w[a.getUint32(c + 4, !0)],
                c = c + 8;
            k && f && (f.destroy(), f.ox = f.x, f.oy = f.y, f.oSize = f.size, f.nx = k.x, f.ny = k.y, f.nSize = f.size, f.updateTime = E)
        }
        for (;;) {
            d = a.getUint32(c, !0);
            c += 4;
            if (0 == d) break;
            for (var e = a.getFloat32(c, !0), c = c + 4, k = a.getFloat32(c, !0), c = c + 4, f = a.getFloat32(c, !0), c = c + 4, h = a.getUint8(c++), m = a.getUint8(c++), p = a.getUint8(c++), h = (h << 16 | m << 8 | p).toString(16); 6 > h.length;) h = "0" + h;
            var h = "#" + h,
                l = a.getUint8(c++),
                m = !!(l & 1),
                p = !!(l & 16);
            l & 2 && (c += 4);
            l & 4 && (c += 8);
            l & 8 && (c += 16);
            for (l = "";;) {
                var n = a.getUint16(c, !0),
                    c = c + 2;
                if (0 == n) break;
                l += String.fromCharCode(n)
            }
            n = null;
            w.hasOwnProperty(d) ? (n = w[d], n.updatePos(), n.ox = n.x, n.oy = n.y, n.oSize = n.size, n.color = h) : (n = new wa(d, e, k, f, h, l), n.pX = e, n.pY = k);
            n.isVirus = m;
            n.isAgitated = p;
            n.nx = e;
            n.ny = k;
            n.nSize = f;
            n.updateCode = b;
            n.updateTime = E; - 1 != B.indexOf(d) && -1 == g.indexOf(n) && (document.getElementById("overlays").style.display = "none", g.push(n), 1 == g.length && (s = n.x, t = n.y))
        }
        a.getUint16(c, !0);
        c += 2;
        k = a.getUint32(c, !0);
        c += 4;
        for (e = 0; e < k; e++) d = a.getUint32(c, !0), c += 4, w[d] && (w[d].updateCode = b);
        for (e = 0; e < q.length; e++) q[e].updateCode != b && q[e--].destroy();
        ga && 0 == g.length && na(!1)
    }

    function H() {
        if (ha()) {
            var a = O - p / 2,
                b = P - r / 2;
            64 > a * a + b * b || xa == Q && ya == R || (xa = Q, ya = R, a = new ArrayBuffer(21), b = new DataView(a), b.setUint8(0, 16), b.setFloat64(1, Q, !0), b.setFloat64(9, R, !0), b.setUint32(17, 0, !0), m.send(a))
        }
    }

    function ua() {
        if (ha() && null != F) {
            var a = new ArrayBuffer(1 + 2 * F.length),
                b = new DataView(a);
            b.setUint8(0, 0);
            for (var c = 0; c < F.length; ++c) b.setUint16(1 + 2 * c, F.charCodeAt(c), !0);
            m.send(a)
        }
    }

    function ha() {
        return null != m && m.readyState == m.OPEN
    }

    function A(a) {
        if (ha()) {
            var b = new ArrayBuffer(1);
            (new DataView(b)).setUint8(0, a);
            m.send(b)
        }
    }

    function pa() {
        da();
        f.requestAnimationFrame(pa)
    }

    function oa() {
        p = f.innerWidth;
        r = f.innerHeight;
        ba.width = z.width = p;
        ba.height = z.height = r;
        da()
    }

    function Ka() {
        if (0 != g.length) {
            for (var a = 0, b = 0; b < g.length; b++) a += g[b].size;
            a = Math.pow(Math.min(64 / a, 1), .4) * Math.max(r / 1080, p / 1920);
            h = (9 * h + a) / 10
        }
    }

    function da() {
        var a = +new Date;
        ++La;
        E = +new Date;
        if (0 < g.length) {
            Ka();
            for (var b = 0, c = 0, d = 0; d < g.length; d++) g[d].updatePos(), b += g[d].x / g.length, c += g[d].y / g.length;
            L = b;
            M = c;
            N = h;
            s = (s + b) / 2;
            t = (t + c) / 2
        } else s = (29 * s + L) / 30, t = (29 * t + M) / 30, h = (9 * h + N) / 10;
        Ea();
        ca();
        e.clearRect(0, 0, p, r);
        e.fillStyle = ia ? "#111111" : "#F2FBFF";
        e.fillRect(0, 0, p, r);
        e.save();
        e.strokeStyle = ia ? "#AAAAAA" : "#000000";
        e.globalAlpha = .2;
        e.scale(h, h);
        b = p / h;
        c = r / h;
        for (d = -.5 + (-s + b / 2) % 50; d < b; d += 50) e.beginPath(), e.moveTo(d, 0), e.lineTo(d, c), e.stroke();
        for (d = -.5 + (-t + c / 2) % 50; d < c; d += 50) e.beginPath(), e.moveTo(0, d), e.lineTo(b, d), e.stroke();
        e.restore();
        q.sort(function(a, b) {
            return a.size == b.size ? a.id - b.id : a.size - b.size
        });
        e.save();
        e.translate(p / 2, r / 2);
        e.scale(h, h);
        e.translate(-s, -t);
        for (d = 0; d < C.length; d++) C[d].draw();
        for (d = 0; d < q.length; d++) q[d].draw();
		bot.draw(e) //TODO premium feature
        e.restore();
        x && e.drawImage(x, p - x.width - 10, 10);
        D = Math.max(D, Ma());
        0 != D && (null == Z && (Z = new $(24, "#FFFFFF")), Z.setValue("Score: " + ~~(D / 100)), c = Z.render(), b = c.width, e.globalAlpha = .2, e.fillStyle = "#000000", e.fillRect(10, r - 10 - 24 - 10, b + 10, 34), e.globalAlpha = 1, e.drawImage(c, 15, r - 10 - 24 - 5));
        Na();
        a = +new Date - a;
        a > 1E3 / 60 ? v -= .01 : a < 1E3 / 65 && (v += .01);.4 > v && (v = .4);
        1 < v && (v = 1)
    }

    function Na() {
        if (ma && ja.width) {
            var a = p / 5;
            e.drawImage(ja, 5, 5, a, a)
        }
    }

    function Ma() {
        for (var a = 0, b = 0; b < g.length; b++) a += g[b].nSize * g[b].nSize;
        return a
    }

    function va() {
        x = null;
        if (null != u || 0 != y.length)
            if (null != u || aa) {
                x = document.createElement("canvas");
                var a = x.getContext("2d"),
                    b = 60,
                    b = null == u ? b + 24 * y.length : b + 180,
                    c = Math.min(200, .3 * p) / 200;
                x.width = 200 * c;
                x.height = b * c;
                a.scale(c,
                    c);
                a.globalAlpha = .4;
                a.fillStyle = "#000000";
                a.fillRect(0, 0, 200, b);
                a.globalAlpha = 1;
                a.fillStyle = "#FFFFFF";
                c = null;
                c = "Leaderboard";
                a.font = "30px Ubuntu";
                a.fillText(c, 100 - a.measureText(c).width / 2, 40);
                if (null == u)
                    for (a.font = "20px Ubuntu", b = 0; b < y.length; ++b) c = y[b].name || "An unnamed cell", aa || (c = "An unnamed cell"), -1 != B.indexOf(y[b].id) ? (g[0].name && (c = g[0].name), a.fillStyle = "#FFAAAA") : a.fillStyle = "#FFFFFF", c = b + 1 + ". " + c, a.fillText(c, 100 - a.measureText(c).width / 2, 70 + 24 * b);
                else
                    for (b = c = 0; b < u.length; ++b) angEnd = c +
                        u[b] * Math.PI * 2, a.fillStyle = Oa[b + 1], a.beginPath(), a.moveTo(100, 140), a.arc(100, 140, 80, c, angEnd, !1), a.fill(), c = angEnd
            }
    }

    function wa(a, b, c, d, e, f) {
        q.push(this);
        w[a] = this;
        this.id = a;
        this.ox = this.x = b;
        this.oy = this.y = c;
        this.oSize = this.size = d;
        this.color = e;
        this.points = [];
        this.pointsAcc = [];
        this.createPoints();
        this.setName(f)
    }

    function $(a, b, c, d) {
        a && (this._size = a);
        b && (this._color = b);
        this._stroke = !!c;
        d && (this._strokeColor = d)
    }
    if ("agar.io" != f.location.hostname && "localhost" != f.location.hostname && "10.10.2.13" != f.location.hostname) f.location = "http://agar.io/";
    else if (f.top != f) f.top.location = "http://agar.io/";
    else {
        var ba, e, z, p, r, I = null,
            m = null,
            s = 0,
            t = 0,
            B = [],
            g = [],
            w = {},
            q = [],
            C = [],
            y = [],
            O = 0,
            P = 0,
            Q = -1,
            R = -1,
            La = 0,
            E = 0,
            F = null,
            V = 0,
            W = 0,
            X = 1E4,
            Y = 1E4,
            h = 1,
            J = null,
            za = !0,
            aa = !0,
            ka = !1,
            ga = !1,
            D = 0,
            ia = !1,
            Aa = !1,
            L = s = ~~((V + X) / 2),
            M = t = ~~((W + Y) / 2),
            N = 1,
            K = "",
            u = null,
            fa = 0,
            Oa = ["#333333", "#FF3333", "#33FF33", "#3333FF"],
            ma = "ontouchstart" in f && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            ja = new Image;
        ja.src = "img/split.png";
        var Ba = document.createElement("canvas");
        if ("undefined" == typeof console || "undefined" == typeof DataView || "undefined" == typeof WebSocket || null == Ba || null == Ba.getContext) alert("You browser does not support this game, we recommend you to use Firefox to play this");
        else {
            var S = null;
            f.setNick = function(a) {
                ra();
                F = a;
                ua();
                D = 0
            };
            f.setRegion = qa;
            f.setSkins = function(a) {
                za = a
            };
            f.setNames = function(a) {
                aa = a
            };
            f.setDarkTheme = function(a) {
                ia = a
            };
            f.setColors = function(a) {
                ka = a
            };
            f.setShowMass = function(a) {
                Aa = a
            };
            f.spectate = function() {
                F = null;
                A(1);
                ra()
            };
            f.setGameMode = function(a) {
                a != K && (K = a, ea())
            };
            null != f.localStorage && (null == f.localStorage.AB2 && (f.localStorage.AB2 = 1 + ~~(3 * Math.random())), fa = f.localStorage.AB2, f.ABGroup = fa);
            var T = !1;
            setTimeout(function() {
                T = !0
            }, 3E5);
            f.connect = ta;
            var U = 500,
                xa = -1,
                ya = -1,
                x = null,
                v = 1,
                Z = null,
                G = {},
                Ca = "poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;hitler;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;ussr;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina;scotland;sir;romania;belarus;wojak;doge;nasa;byzantium;imperial japan;french kingdom;somalia;turkey;mars;pokerface;8".split(";");
            l.get("http://gc.agar.io", function(a) {
                2 == a.length && -1 == "DE IL PL HU BR AT".split(" ").indexOf(a) && Ca.push("nazi")
            }, "text");
            var Pa = ["m'blob"];
            wa.prototype = {
                id: 0,
                points: null,
                pointsAcc: null,
                name: null,
                nameCache: null,
                sizeCache: null,
                x: 0,
                y: 0,
                size: 0,
                ox: 0,
                oy: 0,
                oSize: 0,
                nx: 0,
                ny: 0,
                nSize: 0,
                updateTime: 0,
                updateCode: 0,
                drawTime: 0,
                destroyed: !1,
                isVirus: !1,
                isAgitated: !1,
                wasSimpleDrawing: !0,
                destroy: function() {
                    var a;
                    for (a = 0; a < q.length; a++)
                        if (q[a] == this) {
                            q.splice(a, 1);
                            break
                        }
                    delete w[this.id];
                    a = g.indexOf(this); - 1 != a && (ga = !0, g.splice(a, 1));
                    a = B.indexOf(this.id); - 1 != a && B.splice(a, 1);
                    this.destroyed = !0;
                    C.push(this)
                },
                getNameSize: function() {
                    return Math.max(~~(.3 * this.size), 24)
                },
                setName: function(a) {
                    if (this.name = a) null == this.nameCache ? this.nameCache = new $(this.getNameSize(), "#FFFFFF", !0, "#000000") : this.nameCache.setSize(this.getNameSize()), this.nameCache.setValue(this.name)
                },
                createPoints: function() {
                    for (var a = this.getNumPoints(); this.points.length > a;) {
                        var b = ~~(Math.random() * this.points.length);
                        this.points.splice(b, 1);
                        this.pointsAcc.splice(b, 1)
                    }
                    0 == this.points.length && 0 < a && (this.points.push({
                        c: this,
                        v: this.size,
                        x: this.x,
                        y: this.y
                    }), this.pointsAcc.push(Math.random() - .5));
                    for (; this.points.length < a;) {
                        var b = ~~(Math.random() * this.points.length),
                            c = this.points[b];
                        this.points.splice(b, 0, {
                            c: this,
                            v: c.v,
                            x: c.x,
                            y: c.y
                        });
                        this.pointsAcc.splice(b, 0, this.pointsAcc[b])
                    }
                },
                getNumPoints: function() {
                    var a = 10;
                    20 > this.size && (a = 5);
                    this.isVirus && (a = 30);
                    return ~~Math.max(this.size * h * (this.isVirus ? Math.min(2 * v, 1) : v), a)
                },
                movePoints: function() {
                    this.createPoints();
                    for (var a = this.points, b = this.pointsAcc, c = a.length, d = 0; d < c; ++d) {
                        var e = b[(d - 1 + c) % c],
                            f = b[(d + 1) % c];
                        b[d] += (Math.random() - .5) * (this.isAgitated ? 3 : 1);
                        b[d] *= .7;
                        10 < b[d] && (b[d] = 10); - 10 > b[d] && (b[d] = -10);
                        b[d] = (e + f + 8 * b[d]) / 10
                    }
                    for (var h = this, d = 0; d < c; ++d) {
                        var g = a[d].v,
                            e = a[(d - 1 + c) % c].v,
                            f = a[(d + 1) % c].v;
                        if (15 < this.size && null != I) {
                            var l = !1,
                                m = a[d].x,
                                p = a[d].y;
                            I.retrieve2(m - 5, p - 5, 10, 10, function(a) {
                                a.c != h && 25 > (m - a.x) * (m - a.x) + (p - a.y) * (p - a.y) && (l = !0)
                            });
                            !l && (a[d].x < V || a[d].y < W || a[d].x > X || a[d].y > Y) && (l = !0);
                            l && (0 < b[d] && (b[d] = 0), b[d] -= 1)
                        }
                        g +=
                            b[d];
                        0 > g && (g = 0);
                        g = this.isAgitated ? (19 * g + this.size) / 20 : (12 * g + this.size) / 13;
                        a[d].v = (e + f + 8 * g) / 10;
                        e = 2 * Math.PI / c;
                        f = this.points[d].v;
                        this.isVirus && 0 == d % 2 && (f += 5);
                        a[d].x = this.x + Math.cos(e * d) * f;
                        a[d].y = this.y + Math.sin(e * d) * f
                    }
                },
                updatePos: function() {
                    var a;
                    a = (E - this.updateTime) / 120;.5 < a ? 3 < a && (a = 3) : (0 > a && (a = 0), a = a * a * (3 - 2 * a));
                    var b;
                    b = 0 > a ? 0 : 1 < a ? 1 : a;
                    this.getNameSize();
                    if (this.destroyed && 1 <= b) {
                        var c = C.indexOf(this); - 1 != c && C.splice(c, 1)
                    }
                    this.x = a * (this.nx - this.ox) + this.ox;
                    this.y = a * (this.ny - this.oy) + this.oy;
                    this.size =
                        b * (this.nSize - this.oSize) + this.oSize;
                    return b
                },
                shouldRender: function() {
                    return this.x + this.size + 40 < s - p / 2 / h || this.y + this.size + 40 < t - r / 2 / h || this.x - this.size - 40 > s + p / 2 / h || this.y - this.size - 40 > t + r / 2 / h ? !1 : !0
                },
                draw: function() {
                    if (this.shouldRender()) {
                        var a = !this.isVirus && !this.isAgitated && .5 > h;
                        if (this.wasSimpleDrawing && !a)
                            for (var b = 0; b < this.points.length; b++) this.points[b].v = this.size;
                        this.wasSimpleDrawing = a;
                        e.save();
                        this.drawTime = E;
                        b = this.updatePos();
                        this.destroyed && (e.globalAlpha *= 1 - b);
                        e.lineWidth = 10;
                        e.lineCap = "round";
                        e.lineJoin = this.isVirus ? "mitter" : "round";
                        ka ? (e.fillStyle = "#FFFFFF", e.strokeStyle = "#AAAAAA") : (e.fillStyle = this.color, e.strokeStyle = this.color);
                        if (a) e.beginPath(), e.arc(this.x, this.y, this.size, 0, 2 * Math.PI, !1);
                        else {
                            this.movePoints();
                            e.beginPath();
                            var c = this.getNumPoints();
                            e.moveTo(this.points[0].x, this.points[0].y);
                            for (b = 1; b <= c; ++b) {
                                var d = b % c;
                                e.lineTo(this.points[d].x, this.points[d].y)
                            }
                        }
                        e.closePath();
                        b = this.name.toLowerCase();
                        !this.isAgitated && za && "" == K ? -1 != Ca.indexOf(b) ? (G.hasOwnProperty(b) || (G[b] = new Image, G[b].src = "skins/" + b + ".png"), c = 0 != G[b].width && G[b].complete ? G[b] : null) : c = null : c = null;
                        b = c ? -1 != Pa.indexOf(b) : !1;
                        a || e.stroke();
                        e.fill();
                        null == c || b || (e.save(), e.clip(), e.drawImage(c, this.x - this.size, this.y - this.size, 2 * this.size, 2 * this.size), e.restore());
                        (ka || 15 < this.size) && !a && (e.strokeStyle = "#000000", e.globalAlpha *= .1, e.stroke());
                        e.globalAlpha = 1;
                        null != c && b && e.drawImage(c, this.x - 2 * this.size, this.y - 2 * this.size, 4 * this.size, 4 * this.size);
                        c = -1 != g.indexOf(this);
                        a = ~~this.y;
                        if ((aa || c) && this.name && this.nameCache && "8" != this.name) {
                            d = this.nameCache;
                            d.setValue(this.name);
                            d.setSize(this.getNameSize());
                            b = Math.ceil(10 * h) / 10;
                            d.setScale(b);
                            var d = d.render(),
                                f = ~~(d.width / b),
                                k = ~~(d.height / b);
                            e.drawImage(d, ~~this.x - ~~(f / 2), a - ~~(k / 2), f, k);
                            a += d.height / 2 / b + 4
                        }
                        Aa && (c || 0 == g.length && (!this.isVirus || this.isAgitated) && 20 < this.size) && (null == this.sizeCache && (this.sizeCache = new $(this.getNameSize() / 2, "#FFFFFF", !0, "#000000")), c = this.sizeCache, c.setSize(this.getNameSize() / 2), c.setValue(~~(this.size * this.size / 100)), b =
                            Math.ceil(10 * h) / 10, c.setScale(b), d = c.render(), f = ~~(d.width / b), k = ~~(d.height / b), e.drawImage(d, ~~this.x - ~~(f / 2), a - ~~(k / 2), f, k));
                        e.restore()
                    }
                }
            };
            $.prototype = {
                _value: "",
                _color: "#000000",
                _stroke: !1,
                _strokeColor: "#000000",
                _size: 16,
                _canvas: null,
                _ctx: null,
                _dirty: !1,
                _scale: 1,
                setSize: function(a) {
                    this._size != a && (this._size = a, this._dirty = !0)
                },
                setScale: function(a) {
                    this._scale != a && (this._scale = a, this._dirty = !0)
                },
                setColor: function(a) {
                    this._color != a && (this._color = a, this._dirty = !0)
                },
                setStroke: function(a) {
                    this._stroke !=
                        a && (this._stroke = a, this._dirty = !0)
                },
                setStrokeColor: function(a) {
                    this._strokeColor != a && (this._strokeColor = a, this._dirty = !0)
                },
                setValue: function(a) {
                    a != this._value && (this._value = a, this._dirty = !0)
                },
                render: function() {
                    null == this._canvas && (this._canvas = document.createElement("canvas"), this._ctx = this._canvas.getContext("2d"));
                    if (this._dirty) {
                        this._dirty = !1;
                        var a = this._canvas,
                            b = this._ctx,
                            c = this._value,
                            d = this._scale,
                            e = this._size,
                            f = e + "px Ubuntu";
                        b.font = f;
                        var h = b.measureText(c).width,
                            g = ~~(.2 * e);
                        a.width = (h + 6) * d;
                        a.height = (e + g) * d;
                        b.font = f;
                        b.scale(d, d);
                        b.globalAlpha = 1;
                        b.lineWidth = 3;
                        b.strokeStyle = this._strokeColor;
                        b.fillStyle = this._color;
                        this._stroke && b.strokeText(c, 3, e - g / 2);
                        b.fillText(c, 3, e - g / 2)
                    }
                    return this._canvas
                }
            };
            f.onload = Da
        }
    }

	window.skinNames=[
		'nomday.com/bot',
		'Yaranaika',
		'Pokerface',
		'Sir',
		'Mars',
		'Stalin',
		'Moon',
		'Wojak',
		'Imperial Japan',
		'Doge',
		'Earth',
		'Bait',
		'Steam',
		'Piccolo',
		'Sanik',
		'Cia',
		'4chan',
		'Ayy Lmao',
		'Qing Dynasty',
	]

	var bot=window.bot=new Bot(
			function(x,y){Q=x;R=y;H()},
			function(){A(17)},
			function(){A(21)})
	var onUpdate=Ja
	Ja=function(a){
		onUpdate(a)
		bot.tick(q,g,D)
	}

	var onDeath=na
	na=function(a){
		onDeath(a)
		window.setTimeout(function(){window.setNick(window.skinNames[~~(window.skinNames.length*Math.pow(Math.random(),2))])},5000)
	}

})(window, jQuery);

$('body').append('<div id="ip-address"></div>')

setDarkTheme(true)

$('#region')
	.after($('#region').removeAttr('onchange').clone().change(function(e){
				setRegion($('#region').val());$('.region-message').hide();$('.region-message.'+$('#region').val()).show();$('.btn-needs-server').prop('disabled', false);
})).remove()
$('#nick').parent().remove()

$('#playBtn')
	.after($('#playBtn').removeAttr('onclick').clone().click(function(e){
		setNick(window.skinNames[~~(window.skinNames.length*Math.random())]);
		return false;
	})).remove()

$('#gamemode').remove()

$('#playBtn').next().remove()
