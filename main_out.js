(function(f, r) {
	var mouseEnabled=true;
    function ya() {
        ia();
        setInterval(ia, 18E4);
        z = $ = document.getElementById("canvas");
        e = z.getContext("2d");
        z.onmousedown = function(a) {
			mouseEnabled=!mouseEnabled
            if (ja) {
                var b = a.clientX - (5 + p / 5 / 2),
                    c = a.clientY - (5 + p / 5 / 2);
                if (Math.sqrt(b * b + c * c) <= p / 5 / 2) {
                    G();
                    A(17);
                    return
                }
            }
            O = a.clientX;
            P = a.clientY;
            aa();
            G()
        };
        z.onmousemove = function(a) {
            O = a.clientX;
            P = a.clientY;
            aa()
        };
        z.onmouseup = function(a) {};
        var a = !1,
            b = !1,
            c = !1;
        f.onkeydown = function(d) {
            32 != d.keyCode || a || (G(), A(17), a = !0);
            81 != d.keyCode || b || (A(18), b = !0);
            87 != d.keyCode || c || (G(), A(21), c = !0);
            27 == d.keyCode && r("#overlays").fadeIn(200)
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
        f.onresize = ka;
        ka();
        f.requestAnimationFrame ? f.requestAnimationFrame(la) : setInterval(ba, 1E3 / 60);
        setInterval(G, 40);
        ma(r("#region").val());
        r("#overlays").show()
    }

    function za() {
        if (.5 > h) H = null;
        else {
            for (var a = Number.POSITIVE_INFINITY, b = Number.POSITIVE_INFINITY, c = Number.NEGATIVE_INFINITY, d = Number.NEGATIVE_INFINITY, e = 0, k = 0; k < q.length; k++) q[k].shouldRender() && (e = Math.max(q[k].size, e), a = Math.min(q[k].x, a), b = Math.min(q[k].y, b), c = Math.max(q[k].x, c), d = Math.max(q[k].y, d));
            H = QUAD.init({
                minX: a - (e + 100),
                minY: b - (e + 100),
                maxX: c + (e + 100),
                maxY: d + (e + 100)
            });
            for (k = 0; k < q.length; k++)
                if (a = q[k], a.shouldRender())
                    for (b = 0; b < a.points.length; ++b) H.insert(a.points[b])
        }
    }

    function aa() { //calculates the movement direction based on the mouse
		if (mouseEnabled){
			Q = (O - p / 2) / h + s;
			R = (P - m / 2) / h + t
		}else{
			bot.onState(w)
			bot.move=function(x,y){Q=x,R=y}
		}
    }

    function ia() { //request server region info and populate dropdown
        null == S && (S = {}, r("#region").children().each(function() {
            var a = r(this),
                b = a.val();
            b && (S[b] = a.text())
        }));
        r.get("http://m.agar.io/info", function(a) {
            var b = {},
                c;
            for (c in a.regions) {
                var d =
                    c.split(":")[0];
                b[d] = b[d] || 0;
                b[d] += a.regions[c].numPlayers
            }
            for (c in b) r('#region option[value="' + c + '"]').text(S[c] + " (" + b[c] + " players)")
        }, "json")
    }

    function na() { //hide ads and overlays
        r("#adsBottom").hide();
        r("#overlays").hide()
    }

    function ma(a) { //setRegion()
        a && a != I && (I = a, ca())
    }

    function oa() { //get ws ip address
        console.log("Find " + I + J);
        r.ajax("http://m.agar.io/", {
            error: function() {
                setTimeout(oa, 1E3)
            },
            success: function(a) {
                a = a.split("\n");
                pa("ws://" + a[0])
            },
            dataType: "text",
            method: "POST",
            cache: !1,
            crossDomain: !0,
            data: I + J || "?"
        })
    }

    function ca() { //show connecting status
        I && (r("#connecting").show(), oa())
    }

    function pa(a) { //connectToWebsocket(ip)
        if (l) {
            l.onopen = null;
            l.onmessage = null;
            l.onclose = null;
            try {
                l.close()
            } catch (b) {}
            l = null
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
        l = new WebSocket(a);
        l.binaryType = "arraybuffer";
        l.onopen = Aa;
        l.onmessage = Ba;
        l.onclose = Ca;
        l.onerror = function(e) {
            console.log("socket error",e)
        }
    }

    function Aa(a) { //ws onopen
        r("#connecting").hide();
        console.log("socket open");
        a = new ArrayBuffer(5);
        var b = new DataView(a);
        b.setUint8(0, 254);
        b.setUint32(1, 1, !0);
        l.send(a);
        a = new ArrayBuffer(5);
        b = new DataView(a);
        b.setUint8(0, 255);
        b.setUint32(1, 1, !0);
        l.send(a);
        qa()
    }

    function Ca(a) {
        console.log("socket close");
        setTimeout(ca, 500)
    }

    function Ba(a) { //ws onmessage
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
            case 16: //data on viruses in proximity
                Da(d);
                break;
            case 17:
                K = d.getFloat32(1, !0);
                L = d.getFloat32(5, !0);
                M = d.getFloat32(9, !0);
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
                ra();
                break;
            case 50:
                u = [];
                a = d.getUint32(c, !0);
                c += 4;
                for (e = 0; e < a; ++e) u.push(d.getFloat32(c, !0)), c += 4;
                ra();
                break;
            case 64:
                T = d.getFloat64(1, !0), U = d.getFloat64(9, !0), V = d.getFloat64(17, !0), W = d.getFloat64(25, !0), K = (V + T) / 2, L = (W + U) / 2, M = 1, 0 == g.length && (s = K, t = L, h = M)
        }
    }

    function Da(a) {
        E = +new Date;
        var b = Math.random(),
            c = 1;
        da = !1;
        for (var d = a.getUint16(c, !0), c = c + 2, e = 0; e < d; ++e) {
            var k = w[a.getUint32(c, !0)],
                f = w[a.getUint32(c + 4, !0)],
                c = c + 8;
            k && f &&
                (f.destroy(), f.ox = f.x, f.oy = f.y, f.oSize = f.size, f.nx = k.x, f.ny = k.y, f.nSize = f.size, f.updateTime = E)
        }
        for (;;) {
            d = a.getUint32(c, !0);
            c += 4;
            if (0 == d) break;
            for (var e = a.getFloat32(c, !0), c = c + 4, k = a.getFloat32(c, !0), c = c + 4, f = a.getFloat32(c, !0), c = c + 4, h = a.getUint8(c++), l = a.getUint8(c++), p = a.getUint8(c++), h = (h << 16 | l << 8 | p).toString(16); 6 > h.length;) h = "0" + h;
            var h = "#" + h,
                m = a.getUint8(c++),
                l = !!(m & 1),
                p = !!(m & 16);
            m & 2 && (c += 4);
            m & 4 && (c += 8);
            m & 8 && (c += 16);
            for (m = "";;) {
                var n = a.getUint16(c, !0),
                    c = c + 2;
                if (0 == n) break;
                m += String.fromCharCode(n)
            }
            n = null;
            w.hasOwnProperty(d) ? (n = w[d], n.updatePos(), n.ox = n.x, n.oy = n.y, n.oSize = n.size, n.color = h) : (n = new sa(d, e, k, f, h, m), n.pX = e, n.pY = k);
            n.isVirus = l;
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
       	if(da && 0 == g.length){
		   r("#overlays").fadeIn(3E3); //upon death
			console.log("death");
			window.setInterval(function(){window.setNick(document.getElementById('nick').value)},5000)
		}
    }

    function G() { //sends movement to ws server
        if (ea()) {
            var a = O - p / 2,
                b = P - m / 2;
            64 > a * a + b * b || ta == Q && ua == R || (
					ta = Q, 
					ua = R,
					a = new ArrayBuffer(21), 
					b = new DataView(a), 
					b.setUint8(0, 16), 
					b.setFloat64(1, Q, !0), 
					b.setFloat64(9, R, !0), 
					b.setUint32(17, 0, !0), 
					l.send(a)
					)
        }
    }

    function qa() { //start game and send name
        if (ea() && null != N) {
            var a = new ArrayBuffer(1 + 2 * N.length),
                b = new DataView(a);
            b.setUint8(0, 0);
            for (var c = 0; c < N.length; ++c) b.setUint16(1 + 2 * c, N.charCodeAt(c), !0);
            l.send(a)
        }
    }

    function ea() {
        return null != l && l.readyState == l.OPEN
    }

    function A(a) {
        if (ea()) {
            var b = new ArrayBuffer(1);
            (new DataView(b)).setUint8(0, a);
            l.send(b)
        }
    }

    function la() {
        ba();
        f.requestAnimationFrame(la)
    }

    function ka() {
        p = f.innerWidth;
        m = f.innerHeight;
        $.width = z.width = p;
        $.height = z.height = m;
        ba()
    }

    function Ea() {
        if (0 != g.length) {
            for (var a = 0, b = 0; b < g.length; b++) a += g[b].size;
            a = Math.pow(Math.min(64 / a, 1), .4) * Math.max(m / 1080, p / 1920);
            h = (9 * h + a) / 10
        }
    }

    function ba() {
        var a = +new Date;
        ++Fa;
        E = +new Date;
        if (0 < g.length) {
            Ea();
            for (var b = 0, c = 0, d = 0; d < g.length; d++) g[d].updatePos(), b += g[d].x / g.length, c += g[d].y / g.length;
            K = b;
            L = c;
            M = h;
            s = (s + b) / 2;
            t = (t + c) / 2
        } else s = (29 * s + K) / 30, t = (29 * t + L) / 30, h = (9 * h + M) / 10;
        za();
		aa();
        e.clearRect(0, 0, p, m);
        e.fillStyle = fa ? "#111111" : "#F2FBFF";
        e.fillRect(0, 0, p, m);
        e.save();
        e.strokeStyle = fa ? "#AAAAAA" : "#000000";
        e.globalAlpha = .2;
        e.scale(h, h);
        b = p / h;
        c = m / h;
        for (d = -.5 + (-s + b / 2) % 50; d < b; d += 50) e.beginPath(), e.moveTo(d, 0), e.lineTo(d, c), e.stroke();
        for (d = -.5 + (-t + c / 2) % 50; d < c; d += 50) e.beginPath(), e.moveTo(0, d), e.lineTo(b, d), e.stroke();
        e.restore();
        q.sort(function(a, b) {
            return a.size == b.size ? a.id - b.id : a.size - b.size
        });
        e.save();
        e.translate(p / 2, m / 2);
        e.scale(h, h);
        e.translate(-s, -t);
        for (d = 0; d < C.length; d++) C[d].draw();
        for (d = 0; d < q.length; d++) q[d].draw();
        e.restore();
        x && e.drawImage(x, p - x.width - 10, 10);
        D = Math.max(D, Ga());
        0 != D && (null == X && (X = new Y(24, "#FFFFFF")), X.setValue("Score: " + ~~(D / 100)), c = X.render(), b = c.width, e.globalAlpha = .2, e.fillStyle = "#000000", e.fillRect(10, m - 10 - 24 - 10, b + 10, 34), e.globalAlpha = 1, e.drawImage(c, 15, m - 10 - 24 - 5));
        Ha();
        a = +new Date - a;
        a > 1E3 / 60 ? v -= .01 : a < 1E3 / 65 && (v += .01);.4 > v && (v = .4);
        1 < v && (v = 1)
    }

    function Ha() {
        if (ja && ga.width) {
            var a = p / 5;
            e.drawImage(ga, 5, 5, a, a)
        }
    }

    function Ga() {
        for (var a = 0, b = 0; b < g.length; b++) a += g[b].nSize * g[b].nSize;
        return a
    }

    function ra() {
        x = null;
        if (null != u || 0 != y.length)
            if (null != u || Z) {
                x = document.createElement("canvas");
                var a = x.getContext("2d"),
                    b = 60,
                    b = null == u ? b + 24 * y.length : b + 180,
                    c = Math.min(200, .3 * p) / 200;
                x.width = 200 * c;
                x.height = b * c;
                a.scale(c, c);
                a.globalAlpha = .4;
                a.fillStyle = "#000000";
                a.fillRect(0, 0, 200, b);
                a.globalAlpha = 1;
                a.fillStyle = "#FFFFFF";
                c = null;
                c = "Leaderboard";
                a.font = "30px Ubuntu";
                a.fillText(c, 100 - a.measureText(c).width /
                    2, 40);
                if (null == u)
                    for (a.font = "20px Ubuntu", b = 0; b < y.length; ++b) c = y[b].name || "An unnamed cell", Z || (c = "An unnamed cell"), -1 != B.indexOf(y[b].id) ? (g[0].name && (c = g[0].name), a.fillStyle = "#FFAAAA") : a.fillStyle = "#FFFFFF", c = b + 1 + ". " + c, a.fillText(c, 100 - a.measureText(c).width / 2, 70 + 24 * b);
                else
                    for (b = c = 0; b < u.length; ++b) angEnd = c + u[b] * Math.PI * 2, a.fillStyle = Ia[b + 1], a.beginPath(), a.moveTo(100, 140), a.arc(100, 140, 80, c, angEnd, !1), a.fill(), c = angEnd
            }
    }

    function sa(a, b, c, d, e, f) {
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

    function Y(a, b, c, d) {
        a && (this._size = a);
        b && (this._color = b);
        this._stroke = !!c;
        d && (this._strokeColor = d)
    }
    if ("agar.io" != f.location.hostname && "localhost" != f.location.hostname && "10.10.2.13" != f.location.hostname) f.location = "http://agar.io/";
    else if (f.top != f) f.top.location = "http://agar.io/";
    else {
        var $, e, z, p, m, H = null,
            l = null,
            s = 0,
            t = 0,
            B = [],
            g = [], //what is g? seems important
            w = {},
            q = [],
            C = [],
            y = [],
            O = 0,
            P = 0,
            Q = -1,
            R = -1,
			bot=new Bot("Lio",function(x,y){Q=x,R=y}),
            Fa = 0,
            E = 0,
            N = null, //nick
            T = 0,
            U = 0,
            V = 1E4,
            W = 1E4,
            h = 1,
            I = null,
            va = !0, //sets skin
            Z = !0, //sets name
            ha = !1, //set color
            da = !1, //game in progress?
            D = 0, //could be alpha?
            fa = !1, //dark theme
            wa = 1, //show mass
            K = s = ~~((T + V) / 2),
            L = t = ~~((U + W) / 2),
            M = 1,
            J = "",
            u = null,
            Ia = ["#333333", "#FF3333", "#33FF33", "#3333FF"],
            ja = "ontouchstart" in f && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            ga = new Image;
        ga.src = "img/split.png";
        var xa = document.createElement("canvas");
        if ("undefined" == typeof console || "undefined" == typeof DataView || "undefined" == typeof WebSocket || null == xa || null == xa.getContext) alert("You browser does not support this game, we recommend you to use Firefox to play this");
        else {
            var S = null;
            f.setNick = function(a) {
				bot.name=a;
                na();
                N = a;
                qa();
                D = 0
            };
            f.setRegion = ma;
            f.setSkins = function(a) {
                va = a
            };
            f.setNames = function(a) {
                Z = a
            };
            f.setDarkTheme = function(a) {
                fa = a
            };
            f.setColors = function(a) {
                ha = a
            };
            f.setShowMass = function(a) {
                wa = a
            };
            f.spectate = function() {
                A(1);
                na()
            };
            f.setGameMode = function(a) {
                a != J && (J = a, ca())
            };
            f.connect = pa;
            var ta = -1,
                ua = -1,
                x = null,
                v = 1,
                X = null,
                F = {},
                Ja = "poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;hitler;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;ussr;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;nazi;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina;scotland;sir;romania;belarus;wojak;isis;doge;nasa;byzantium;imperial japan;french kingdom;somalia;turkey;mars;pokerface".split(";"),
                Ka = ["m'blob"];
            sa.prototype = { //enemy organisms
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
                    a = g.indexOf(this); - 1 != a && (da = !0, g.splice(a, 1));
                    a = B.indexOf(this.id); - 1 != a && B.splice(a, 1);
                    this.destroyed = !0;
                    C.push(this)
                },
                getNameSize: function() {
                    return Math.max(~~(.3 * this.size), 24)
                },
                setName: function(a) {
                    if (this.name = a) null == this.nameCache ? this.nameCache = new Y(this.getNameSize(), "#FFFFFF", !0, "#000000") : this.nameCache.setSize(this.getNameSize()), this.nameCache.setValue(this.name)
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
                        if (15 < this.size && null != H) {
                            var l = !1,
                                m = a[d].x,
                                p = a[d].y;
                            H.retrieve2(m - 5, p - 5, 10, 10, function(a) {
                                a.c != h && 25 > (m - a.x) * (m - a.x) + (p - a.y) * (p - a.y) && (l = !0)
                            });
                            !l && (a[d].x < T || a[d].y < U || a[d].x > V || a[d].y > W) && (l = !0);
                            l && (0 < b[d] && (b[d] = 0), b[d] -= 1)
                        }
                        g += b[d];
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
                    a = (E - this.updateTime) / 120;
                    a = 0 > a ? 0 : 1 < a ? 1 : a;
                    a = a * a * (3 - 2 * a);
                    this.getNameSize();
                    if (this.destroyed && 1 <= a) {
                        var b = C.indexOf(this); - 1 != b && C.splice(b, 1)
                    }
                    this.x = a * (this.nx - this.ox) + this.ox;
                    this.y = a * (this.ny - this.oy) + this.oy;
                    this.size = a * (this.nSize - this.oSize) + this.oSize;
                    return a
                },
                shouldRender: function() {
                    return this.x + this.size + 40 < s - p / 2 / h || this.y + this.size + 40 < t - m / 2 / h || this.x - this.size - 40 > s + p /
                        2 / h || this.y - this.size - 40 > t + m / 2 / h ? !1 : !0
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
                        ha ? (e.fillStyle = "#FFFFFF", e.strokeStyle = "#AAAAAA") : (e.fillStyle = this.color, e.strokeStyle = this.color);
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
                        !this.isAgitated && va && "" == J ? -1 != Ja.indexOf(b) ? (F.hasOwnProperty(b) || (F[b] = new Image, F[b].src = "skins/" + b + ".png"), c = 0 != F[b].width && F[b].complete ? F[b] : null) : c = null : c = null;
                        b = c ? -1 != Ka.indexOf(b) : !1;
                        a || e.stroke();
                        e.fill();
                        null == c || b || (e.save(), e.clip(), e.drawImage(c, this.x - this.size, this.y - this.size, 2 * this.size, 2 * this.size), e.restore());
                        (ha || 15 < this.size) && !a && (e.strokeStyle = "#000000", e.globalAlpha *= .1, e.stroke());
                        e.globalAlpha = 1;
                        null != c && b && e.drawImage(c, this.x - 2 * this.size, this.y - 2 * this.size, 4 * this.size, 4 * this.size);
                        c = -1 != g.indexOf(this);
                        a = ~~this.y;
                        if ((Z || c) && this.name && this.nameCache) {
                            d = this.nameCache;
                            d.setValue(this.name);
                            d.setSize(this.getNameSize());
                            b = Math.ceil(10 * h) / 10;
                            d.setScale(b);
                            var d = d.render(),
                                f = ~~(d.width / b),
                                k = ~~(d.height /
                                    b);
                            e.drawImage(d, ~~this.x - ~~(f / 2), a - ~~(k / 2), f, k);
                            a += d.height / 2 / b + 4
                        }
                        wa && (c || 0 == g.length && (!this.isVirus || this.isAgitated) && 20 < this.size) && (null == this.sizeCache && (this.sizeCache = new Y(this.getNameSize() / 2, "#FFFFFF", !0, "#000000")), c = this.sizeCache, c.setSize(this.getNameSize() / 2), c.setValue(~~(this.size * this.size / 100)), b = Math.ceil(10 * h) / 10, c.setScale(b), d = c.render(), f = ~~(d.width / b), k = ~~(d.height / b), e.drawImage(d, ~~this.x - ~~(f / 2), a - ~~(k / 2), f, k));
                        e.restore()
                    }
                }
            };
            Y.prototype = { //game settings?
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
                    this._stroke != a && (this._stroke = a, this._dirty = !0)
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
            f.onload = ya
        }
    }
})(window, jQuery);
