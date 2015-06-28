(function(f, l) {
    function Ta() {
        ma = !0;
        ya();
        setInterval(ya, 18E4);
        C = na = document.getElementById("canvas-2");
        g = C.getContext("2d");
        C.onmousedown = function(a) {
            if (za) {
                var b = a.clientX - (5 + r / 5 / 2),
                    c = a.clientY - (5 + r / 5 / 2);
                if (Math.sqrt(b * b + c * c) <= r / 5 / 2) {
                    N();
                    D(17);
                    return
                }
            }
            U = a.clientX;
            V = a.clientY;
            oa();
            N()
        };
        C.onmousemove = function(a) {
            U = a.clientX;
            V = a.clientY;
            oa()
        };
        C.onmouseup = function() {};
        /firefox/i.test(navigator.userAgent) ? document.addEventListener("DOMMouseScroll", Aa, !1) : document.body.onmousewheel = Aa;
        var a = !1,
            b = !1,
            c = !1;
        f.onkeydown = function(d) {
            32 != d.keyCode || a || (N(), D(17), a = !0);
            81 != d.keyCode || b || (D(18), b = !0);
            87 != d.keyCode || c || (N(), D(21), c = !0);
            27 == d.keyCode && Ba(!0)
        };
        f.onkeyup = function(d) {
            32 == d.keyCode && (a = !1);
            87 == d.keyCode && (c = !1);
            81 == d.keyCode && b && (D(19), b = !1)
        };
        f.onblur = function() {
            D(19);
            c = b = a = !1
        };
        f.onresize = Ca;
        f.requestAnimationFrame ? f.requestAnimationFrame(Da) : setInterval(pa, 1E3 / 60);
        //setInterval(N, 40);
        w && l("#region").val(w);
        Ea();
        W(l("#region").val());
        null == q && w && X();
        l("#overlays").show();
        Ca()
    }

    function Aa(a) {
        E *= Math.pow(.9, a.wheelDelta / -120 || a.detail || 0);
        1 > E && (E = 1);
        E > 4 / k && (E = 4 / k)
    }

    function Ua() {
        if (.4 > k) O = null;
        else {
            for (var a = Number.POSITIVE_INFINITY, b = Number.POSITIVE_INFINITY, c = Number.NEGATIVE_INFINITY, d = Number.NEGATIVE_INFINITY, e = 0, m = 0; m < v.length; m++) {
                var h = v[m];
                !h.I() || h.M || 20 >= h.size * k || (e = Math.max(h.size, e), a = Math.min(h.x, a), b = Math.min(h.y, b), c = Math.max(h.x, c), d = Math.max(h.y, d))
            }
            O = Va.ca({
                X: a - (e + 100),
                Y: b - (e + 100),
                fa: c + (e + 100),
                ga: d + (e + 100),
                da: 2,
                ea: 4
            });
            for (m = 0; m < v.length; m++)
                if (h = v[m], h.I() && !(20 >= h.size * k))
                    for (a = 0; a < h.a.length; ++a) b = h.a[a].x, c = h.a[a].y, b < t - r / 2 / k || c < u - s / 2 / k || b > t + r / 2 / k || c > u + s / 2 / k || O.i(h.a[a])
        }
    }

    function oa() {
        Y = (U - r / 2) / k + t;
        Z = (V - s / 2) / k + u
    }

    function ya() {
        null == $ && ($ = {}, l("#region").children().each(function() {
            var a = l(this),
                b = a.val();
            b && ($[b] = a.text())
        }));
        l.get(aa + "//m.agar.io/info", function(a) {
            var b = {},
                c;
            for (c in a.regions) {
                var d = c.split(":")[0];
                b[d] = b[d] || 0;
                b[d] += a.regions[c].numPlayers
            }
            for (c in b) l('#region option[value="' + c + '"]').text($[c] + " (" + b[c] + " players)")
        }, "json")
    }

    function Fa() {
        l("#adsBottom").hide();
        l("#overlays").hide();
        Ea()
    }

    function W(a) {
        a && a != w && (l("#region").val() != a && l("#region").val(a), w = f.localStorage.location = a, l(".region-message").hide(), l(".region-message." + a).show(), l(".btn-needs-server").prop("disabled", !1), ma && X())
    }

    function Ba(a) {
        F = null;
        l("#overlays").fadeIn(a ? 200 : 3E3);
        a || l("#adsBottom").fadeIn(3E3)
    }

    function Ea() {
        l("#region").val() ? f.localStorage.location = l("#region").val() : f.localStorage.location && l("#region").val(f.localStorage.location);
        l("#region").val() ? l("#locationKnown").append(l("#region")) : l("#locationUnknown").append(l("#region"))
    }

    function Ga() {
        console.log("Find " + w + P);
        l.ajax(aa + "//m.agar.io/", {
            error: function() {
                setTimeout(Ga, 1E3)
            },
            success: function(a) {
                a = a.split("\n");
                Ha("ws://" + a[0], a[1])
            },
            dataType: "text",
            method: "POST",
            cache: !1,
            crossDomain: !0,
            data: (w + P || "?")+"\n"+serverVerId
        })
    }

    function X() {
        ma && w && (l("#connecting").show(), Ga())
    }

    function Ha(a, b) {
        if (q) {
            q.onopen = null;
            q.onmessage = null;
            q.onclose = null;
            try {
                q.close()
            } catch (c) {}
            q = null
        }
        if (Wa) {
            var d = a.split(":");
            a = d[0] + "s://ip-" + d[1].replace(/\./g, "-").replace(/\//g, "") + ".tech.agar.io:" + (+d[2] + 2E3)
        }
        G = [];
        p = [];
        A = {};
        v = [];
        I = [];
        B = [];
        x = y = null;
        J = 0;
        console.log("Connecting to " + a);
        q = new WebSocket(a);
        q.binaryType = "arraybuffer";
        q.onopen = function() {
            var a;
            ba = 500;
            l("#connecting").hide();
            console.log("socket open");
            a = K(5);
            a.setUint8(0, 254);
            a.setUint32(1, 4, !0);
            L(a);
            a = K(5);
            a.setUint8(0, 255);
            a.setUint32(1, serverVerId, !0);
            L(a);
            a = K(1 + b.length);
            a.setUint8(0, 80);
            for (var c = 0; c < b.length; ++c) a.setUint8(c + 1, b.charCodeAt(c));
            L(a);
            Ia()
        };
        q.onmessage = Xa;
        q.onclose = Ya;
        q.onerror = function() {
            console.log("socket error")
        }
    }

    function K(a) {
        return new DataView(new ArrayBuffer(a))
    }

    function L(a) {
        q.send(a.buffer)
    }

    function Ya() {
        console.log("socket close");
        setTimeout(X, ba);
        ba *= 1.5
    }

    function Xa(a) {
        Za(new DataView(a.data))
    }

    function Za(a) {
        function b() {
            for (var b = "";;) {
                var d = a.getUint16(c, !0);
                c += 2;
                if (0 == d) break;
                b += String.fromCharCode(d)
            }
            return b
        }
        var c = 0;
        240 == a.getUint8(c) && (c += 5);
        switch (a.getUint8(c++)) {
            case 16:
                $a(a, c);
                break;
            case 17:
                Q = a.getFloat32(c, !0);
                c += 4;
                R = a.getFloat32(c, !0);
                c += 4;
                S = a.getFloat32(c, !0);
                c += 4;
                break;
            case 20:
                p = [];
                G = [];
                break;
            case 21:
                qa = a.getInt16(c, !0);
                c += 2;
                ra = a.getInt16(c, !0);
                c += 2;
                sa || (sa = !0, ca = qa, da = ra);
                break;
            case 32:
                G.push(a.getUint32(c, !0));
                c += 4;
                break;
            case 49:
                if (null != y) break;
                var d = a.getUint32(c, !0),
                    c = c + 4;
                B = [];
                for (var e = 0; e < d; ++e) {
                    var m = a.getUint32(c, !0),
                        c = c + 4;
                    B.push({
                        id: m,
                        name: b()
                    })
                }
                Ja();
                break;
            case 50:
                y = [];
                d = a.getUint32(c, !0);
                c += 4;
                for (e = 0; e < d; ++e) y.push(a.getFloat32(c, !0)), c += 4;
                Ja();
                break;
            case 64:
                ea = a.getFloat64(c, !0), c += 8, fa = a.getFloat64(c, !0), c += 8, ga = a.getFloat64(c, !0), c += 8, ha = a.getFloat64(c, !0), c += 8, Q = (ga + ea) / 2, R = (ha + fa) / 2, S = 1, 0 == p.length && (t = Q, u = R, k = S)
				onMapSizeUpdate(ea,fa,ga,ha)
		}
    }

    function $a(a, b) {
        H = +new Date;
        var c = Math.random();
        ta = !1;
        var d = a.getUint16(b, !0);
        b += 2;
        for (var e = 0; e < d; ++e) {
            var m = A[a.getUint32(b, !0)],
                h = A[a.getUint32(b + 4, !0)];
            b += 8;
            m && h && (h.S(), h.p = h.x, h.q = h.y, h.o = h.size, h.D = m.x, h.F = m.y, h.n = h.size, h.L = H)
        }
        for (e = 0;;) {
            d = a.getUint32(b, !0);
            b += 4;
            if (0 == d) break;
            ++e;
            var g, m = a.getInt16(b, !0);
            b += 2;
            h = a.getInt16(b, !0);
            b += 2;
            g = a.getInt16(b, !0);
            b += 2;
            for (var f = a.getUint8(b++), k = a.getUint8(b++), l = a.getUint8(b++), f = (f << 16 | k << 8 | l).toString(16); 6 >
                f.length;) f = "0" + f;
            var f = "#" + f,
                k = a.getUint8(b++),
                l = !!(k & 1),
                r = !!(k & 16);
            k & 2 && (b += 4);
            k & 4 && (b += 8);
            k & 8 && (b += 16);
            for (var q, n = "";;) {
                q = a.getUint16(b, !0);
                b += 2;
                if (0 == q) break;
                n += String.fromCharCode(q)
            }
            q = n;
            n = null;
            A.hasOwnProperty(d) ? (n = A[d], n.K(), n.p = n.x, n.q = n.y, n.o = n.size, n.color = f) : (n = new Ka(d, m, h, g, f, q), v.push(n), A[d] = n, n.ka = m, n.la = h);
            n.d = l;
            n.j = r;
            n.D = m;
            n.F = h;
            n.n = g;
            n.ja = c;
            n.L = H;
            n.W = k;
            q && n.Z(q); - 1 != G.indexOf(d) && -1 == p.indexOf(n) && (document.getElementById("overlays").style.display = "none", p.push(n), 1 == p.length && (t = n.x, u = n.y))
        }
        c = a.getUint32(b, !0);
        b += 4;
        for (e = 0; e < c; e++) d = a.getUint32(b, !0), b += 4, n = A[d], null != n && n.S();
        ta && 0 == p.length && Ba(!1)
    }

    function N() {
        var a;
        if (ua()) {
            a = U - r / 2;
            var b = V - s / 2;
            64 > a * a + b * b || .01 > Math.abs(La - Y) && .01 > Math.abs(Ma - Z) || (La = Y, Ma = Z, a = K(21), a.setUint8(0, 16), a.setFloat64(1, Y, !0), a.setFloat64(9, Z, !0), a.setUint32(17, 0, !0), L(a))
        }
    }

    function Ia() {
        if (ua() && null != F) {
            var a = K(1 + 2 * F.length);
            a.setUint8(0, 0);
            for (var b = 0; b < F.length; ++b) a.setUint16(1 + 2 * b, F.charCodeAt(b), !0);
            L(a)
        }
    }

    function ua() {
        return null != q && q.readyState == q.OPEN
    }

    function D(a) {
        if (ua()) {
            var b = K(1);
            b.setUint8(0, a);
            L(b)
        }
    }

    function Da() {
        pa();
        f.requestAnimationFrame(Da)
    }

    function Ca() {
        r = f.innerWidth;
        s = f.innerHeight;
        na.width = C.width = r;
        na.height = C.height = s;
        var a = l("#helloDialog");
        a.css("transform", "none");
        var b = a.height(),
            c = f.innerHeight;
        b > c / 1.1 ? a.css("transform", "translate(-50%, -50%) scale(" + c / b / 1.1 + ")") : a.css("transform", "translate(-50%, -50%)");
        pa()
    }

    function Na() {
        var a;
        a = 1 * Math.max(s / 1080, r / 1920);
        return a *= E
    }

    function ab() {
        if (0 != p.length) {
            for (var a = 0, b = 0; b < p.length; b++) a += p[b].size;
            a = Math.pow(Math.min(64 / a, 1), .4) * Na();
            k = (9 * k + a) / 10
        }
    }

    function pa() {
        var a, b = Date.now();
        ++bb;
        H = b;
        if (0 < p.length) {
            ab();
            for (var c = a = 0, d = 0; d < p.length; d++) p[d].K(), a += p[d].x / p.length, c += p[d].y / p.length;
            Q = a;
            R = c;
            S = k;
            t = (t + a) / 2;
            u = (u + c) / 2
        } else t = (29 * t + Q) / 30, u = (29 * u + R) / 30, k = (9 * k + S * Na()) / 10;
        Ua();
        oa();
        va || g.clearRect(0, 0, r, s);
        va ? (g.fillStyle = ia ? "#111111" : "#F2FBFF", g.globalAlpha = .05, g.fillRect(0, 0, r, s), g.globalAlpha = 1) : cb();
        v.sort(function(a, b) {
            return a.size == b.size ? a.id - b.id : a.size -
                b.size
        });
        g.save();
        g.translate(r / 2, s / 2);
        g.scale(k, k);
        g.translate(-t, -u);
        for (d = 0; d < I.length; d++) I[d].T(g);
        for (d = 0; d < v.length; d++) v[d].T(g);
    	ai.draw(g)
        if (sa) {
            ca = (3 * ca + qa) / 4;
            da = (3 * da + ra) / 4;
            g.save();
            g.strokeStyle = "#FFAAAA";
            g.lineWidth = 10;
            g.lineCap = "round";
            g.lineJoin = "round";
            g.globalAlpha = .5;
            g.beginPath();
            for (d = 0; d < p.length; d++) g.moveTo(p[d].x, p[d].y), g.lineTo(ca, da);
            g.stroke();
            g.restore()
        }
        g.restore();
        x && x.width && g.drawImage(x, r - x.width - 10, 10);
        J = Math.max(J, db());
		/*
        0 != J && (null == ja && (ja = new ka(24, "#FFFFFF")), ja.u("Score: " +
            ~~(J / 100)), c = ja.G(), a = c.width, g.globalAlpha = .2, g.fillStyle = "#000000", g.fillRect(10, s - 10 - 24 - 10, a + 10, 34), g.globalAlpha = 1, g.drawImage(c, 15, s - 10 - 24 - 5));
       */ 
		eb();
        b = Date.now() - b;
        b > 1E3 / 60 ? z -= .01 : b < 1E3 / 65 && (z += .01);.4 > z && (z = .4);
        1 < z && (z = 1)
    }

    function cb() {
        g.fillStyle = ia ? "#111111" : "#F2FBFF";
        g.fillRect(0, 0, r, s);
        g.save();
        g.strokeStyle = ia ? "#AAAAAA" : "#000000";
        g.globalAlpha = .2;
        g.scale(k, k);
        for (var a = r / k, b = s / k, c = -.5 + (-t + a / 2) % 50; c < a; c += 50) g.beginPath(), g.moveTo(c, 0), g.lineTo(c, b), g.stroke();
        for (c = -.5 + (-u + b / 2) % 50; c < b; c += 50) g.beginPath(), g.moveTo(0, c), g.lineTo(a, c), g.stroke();
        g.restore()
    }

    function eb() {
        if (za && wa.width) {
            var a = r / 5;
            g.drawImage(wa, 5, 5, a, a)
        }
    }

    function db() {
        for (var a = 0, b = 0; b < p.length; b++) a += p[b].n * p[b].n;
        return a
    }

    function Ja() {
        x = null;
        if (null != y || 0 != B.length)
            if (null != y || la) {
                x = document.createElement("canvas");
                var a = x.getContext("2d"),
                    b = 60,
                    b = null == y ? b + 24 * B.length : b + 180,
                    c = Math.min(200, .3 * r) / 200;
                x.width = 200 * c;
                x.height = b * c;
                a.scale(c, c);
                a.globalAlpha = .4;
                a.fillStyle = "#000000";
                a.fillRect(0, 0, 200, b);
                a.globalAlpha =
                    1;
                a.fillStyle = "#FFFFFF";
                c = null;
                c = "Leaderboard";
                a.font = "30px Ubuntu";
                a.fillText(c, 100 - a.measureText(c).width / 2, 40);
                if (null == y)
                    for (a.font = "20px Ubuntu", b = 0; b < B.length; ++b) c = B[b].name || "An unnamed cell", la || (c = "An unnamed cell"), -1 != G.indexOf(B[b].id) ? (p[0].name && (c = p[0].name), a.fillStyle = "#FFAAAA") : a.fillStyle = "#FFFFFF", c = b + 1 + ". " + c, a.fillText(c, 100 - a.measureText(c).width / 2, 70 + 24 * b);
                else
                    for (b = c = 0; b < y.length; ++b) {
                        var d = c + y[b] * Math.PI * 2;
                        a.fillStyle = fb[b + 1];
                        a.beginPath();
                        a.moveTo(100, 140);
                        a.arc(100, 140, 80, c, d, !1);
                        a.fill();
                        c = d
                    }
            }
    }

    function Ka(a, b, c, d, e, m) {
        this.id = a;
        this.p = this.x = b;
        this.q = this.y = c;
        this.o = this.size = d;
        this.color = e;
        this.a = [];
        this.l = [];
        this.R();
        this.Z(m)
    }

    function ka(a, b, c, d) {
        a && (this.r = a);
        b && (this.N = b);
        this.P = !!c;
        d && (this.s = d)
    }
    var aa = f.location.protocol,
        Wa = "https:" == aa;
    if (f.location.ancestorOrigins && f.location.ancestorOrigins.length && "https://apps.facebook.com" != f.location.ancestorOrigins[0]) f.top.location = "http://agar.io/";
    else {
        var na, g, C, r, s, O = null,
            q = null,
            t = 0,
            u = 0,
            G = [],
            p = [],
            A = {},
            v = [],
            I = [],
            B = [],
            U = 0,
            V = 0,
            Y = -1,
            Z = -1,
            bb = 0,
            H = 0,
            F = null,
            ea = 0,
            fa = 0,
            ga = 1E4,
            ha = 1E4,
            k = 1,
            w = null,
            Oa = !0,
            la = !0,
            xa = !1,
            ta = !1,
            J = 0,
            ia = !1,
            Pa = !1,
            Q = t = ~~((ea + ga) / 2),
            R = u = ~~((fa + ha) / 2),
            S = 1,
            P = "",
            y = null,
            ma = !1,
            sa = !1,
            qa = 0,
            ra = 0,
            ca = 0,
            da = 0,
            Qa = 0,
            fb = ["#333333", "#FF3333", "#33FF33", "#3333FF"],
            va = !1,
            E = 1,
            za = "ontouchstart" in f && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            wa = new Image;
        wa.src = "img/split.png";
        var Ra = document.createElement("canvas");
        if ("undefined" == typeof console || "undefined" == typeof DataView ||
            "undefined" == typeof WebSocket || null == Ra || null == Ra.getContext || null == f.localStorage) alert("You browser does not support this game, we recommend you to use Firefox to play this");
        else {
            var $ = null;
            f.setNick = function(a) {
                Fa();
                F = a;
                Ia();
                J = 0
            };
            f.setRegion = W;
            f.setSkins = function(a) {
                Oa = a
            };
            f.setNames = function(a) {
                la = a
            };
            f.setDarkTheme = function(a) {
                ia = a
            };
            f.setColors = function(a) {
                xa = a
            };
            f.setShowMass = function(a) {
                Pa = a
            };
            f.spectate = function() {
                F = null;
                D(1);
                Fa()
            };
            f.setGameMode = function(a) {
                a != P && (P = a, X())
            };
            f.setAcid = function(a) {
                va = a
            };
            null != f.localStorage && (null == f.localStorage.AB8 && (f.localStorage.AB8 = 0 + ~~(100 * Math.random())), Qa = +f.localStorage.AB8, f.ABGroup = Qa);
            l.get(aa + "//gc.agar.io", function(a) {
                var b = a.split(" ");
                a = b[0];
                b = b[1] || ""; - 1 == ["UA"].indexOf(a) && Sa.push("ussr");
                T.hasOwnProperty(a) && ("string" == typeof T[a] ? w || W(T[a]) : T[a].hasOwnProperty(b) && (w || W(T[a][b])))
            }, "text");
            setTimeout(function() {}, 3E5);
            var T = {
                AF: "JP-Tokyo",
                AX: "EU-London",
                AL: "EU-London",
                DZ: "EU-London",
                AS: "SG-Singapore",
                AD: "EU-London",
                AO: "EU-London",
                AI: "US-Atlanta",
                AG: "US-Atlanta",
                AR: "BR-Brazil",
                AM: "JP-Tokyo",
                AW: "US-Atlanta",
                AU: "SG-Singapore",
                AT: "EU-London",
                AZ: "JP-Tokyo",
                BS: "US-Atlanta",
                BH: "JP-Tokyo",
                BD: "JP-Tokyo",
                BB: "US-Atlanta",
                BY: "EU-London",
                BE: "EU-London",
                BZ: "US-Atlanta",
                BJ: "EU-London",
                BM: "US-Atlanta",
                BT: "JP-Tokyo",
                BO: "BR-Brazil",
                BQ: "US-Atlanta",
                BA: "EU-London",
                BW: "EU-London",
                BR: "BR-Brazil",
                IO: "JP-Tokyo",
                VG: "US-Atlanta",
                BN: "JP-Tokyo",
                BG: "EU-London",
                BF: "EU-London",
                BI: "EU-London",
                KH: "JP-Tokyo",
                CM: "EU-London",
                CA: "US-Atlanta",
                CV: "EU-London",
                KY: "US-Atlanta",
                CF: "EU-London",
                TD: "EU-London",
                CL: "BR-Brazil",
                CN: "CN-China",
                CX: "JP-Tokyo",
                CC: "JP-Tokyo",
                CO: "BR-Brazil",
                KM: "EU-London",
                CD: "EU-London",
                CG: "EU-London",
                CK: "SG-Singapore",
                CR: "US-Atlanta",
                CI: "EU-London",
                HR: "EU-London",
                CU: "US-Atlanta",
                CW: "US-Atlanta",
                CY: "JP-Tokyo",
                CZ: "EU-London",
                DK: "EU-London",
                DJ: "EU-London",
                DM: "US-Atlanta",
                DO: "US-Atlanta",
                EC: "BR-Brazil",
                EG: "EU-London",
                SV: "US-Atlanta",
                GQ: "EU-London",
                ER: "EU-London",
                EE: "EU-London",
                ET: "EU-London",
                FO: "EU-London",
                FK: "BR-Brazil",
                FJ: "SG-Singapore",
                FI: "EU-London",
                FR: "EU-London",
                GF: "BR-Brazil",
                PF: "SG-Singapore",
                GA: "EU-London",
                GM: "EU-London",
                GE: "JP-Tokyo",
                DE: "EU-London",
                GH: "EU-London",
                GI: "EU-London",
                GR: "EU-London",
                GL: "US-Atlanta",
                GD: "US-Atlanta",
                GP: "US-Atlanta",
                GU: "SG-Singapore",
                GT: "US-Atlanta",
                GG: "EU-London",
                GN: "EU-London",
                GW: "EU-London",
                GY: "BR-Brazil",
                HT: "US-Atlanta",
                VA: "EU-London",
                HN: "US-Atlanta",
                HK: "JP-Tokyo",
                HU: "EU-London",
                IS: "EU-London",
                IN: "JP-Tokyo",
                ID: "JP-Tokyo",
                IR: "JP-Tokyo",
                IQ: "JP-Tokyo",
                IE: "EU-London",
                IM: "EU-London",
                IL: "JP-Tokyo",
                IT: "EU-London",
                JM: "US-Atlanta",
                JP: "JP-Tokyo",
                JE: "EU-London",
                JO: "JP-Tokyo",
                KZ: "JP-Tokyo",
                KE: "EU-London",
                KI: "SG-Singapore",
                KP: "JP-Tokyo",
                KR: "JP-Tokyo",
                KW: "JP-Tokyo",
                KG: "JP-Tokyo",
                LA: "JP-Tokyo",
                LV: "EU-London",
                LB: "JP-Tokyo",
                LS: "EU-London",
                LR: "EU-London",
                LY: "EU-London",
                LI: "EU-London",
                LT: "EU-London",
                LU: "EU-London",
                MO: "JP-Tokyo",
                MK: "EU-London",
                MG: "EU-London",
                MW: "EU-London",
                MY: "JP-Tokyo",
                MV: "JP-Tokyo",
                ML: "EU-London",
                MT: "EU-London",
                MH: "SG-Singapore",
                MQ: "US-Atlanta",
                MR: "EU-London",
                MU: "EU-London",
                YT: "EU-London",
                MX: "US-Atlanta",
                FM: "SG-Singapore",
                MD: "EU-London",
                MC: "EU-London",
                MN: "JP-Tokyo",
                ME: "EU-London",
                MS: "US-Atlanta",
                MA: "EU-London",
                MZ: "EU-London",
                MM: "JP-Tokyo",
                NA: "EU-London",
                NR: "SG-Singapore",
                NP: "JP-Tokyo",
                NL: "EU-London",
                NC: "SG-Singapore",
                NZ: "SG-Singapore",
                NI: "US-Atlanta",
                NE: "EU-London",
                NG: "EU-London",
                NU: "SG-Singapore",
                NF: "SG-Singapore",
                MP: "SG-Singapore",
                NO: "EU-London",
                OM: "JP-Tokyo",
                PK: "JP-Tokyo",
                PW: "SG-Singapore",
                PS: "JP-Tokyo",
                PA: "US-Atlanta",
                PG: "SG-Singapore",
                PY: "BR-Brazil",
                PE: "BR-Brazil",
                PH: "JP-Tokyo",
                PN: "SG-Singapore",
                PL: "EU-London",
                PT: "EU-London",
                PR: "US-Atlanta",
                QA: "JP-Tokyo",
                RE: "EU-London",
                RO: "EU-London",
                RU: "RU-Russia",
                RW: "EU-London",
                BL: "US-Atlanta",
                SH: "EU-London",
                KN: "US-Atlanta",
                LC: "US-Atlanta",
                MF: "US-Atlanta",
                PM: "US-Atlanta",
                VC: "US-Atlanta",
                WS: "SG-Singapore",
                SM: "EU-London",
                ST: "EU-London",
                SA: "EU-London",
                SN: "EU-London",
                RS: "EU-London",
                SC: "EU-London",
                SL: "EU-London",
                SG: "JP-Tokyo",
                SX: "US-Atlanta",
                SK: "EU-London",
                SI: "EU-London",
                SB: "SG-Singapore",
                SO: "EU-London",
                ZA: "EU-London",
                SS: "EU-London",
                ES: "EU-London",
                LK: "JP-Tokyo",
                SD: "EU-London",
                SR: "BR-Brazil",
                SJ: "EU-London",
                SZ: "EU-London",
                SE: "EU-London",
                CH: "EU-London",
                SY: "EU-London",
                TW: "JP-Tokyo",
                TJ: "JP-Tokyo",
                TZ: "EU-London",
                TH: "JP-Tokyo",
                TL: "JP-Tokyo",
                TG: "EU-London",
                TK: "SG-Singapore",
                TO: "SG-Singapore",
                TT: "US-Atlanta",
                TN: "EU-London",
                TR: "TK-Turkey",
                TM: "JP-Tokyo",
                TC: "US-Atlanta",
                TV: "SG-Singapore",
                UG: "EU-London",
                UA: "EU-London",
                AE: "EU-London",
                GB: "EU-London",
                US: {
                    AL: "US-Atlanta",
                    AK: "US-Fremont",
                    AZ: "US-Fremont",
                    AR: "US-Atlanta",
                    CA: "US-Fremont",
                    CO: "US-Fremont",
                    CT: "US-Atlanta",
                    DE: "US-Atlanta",
                    FL: "US-Atlanta",
                    GA: "US-Atlanta",
                    HI: "US-Fremont",
                    ID: "US-Fremont",
                    IL: "US-Atlanta",
                    IN: "US-Atlanta",
                    IA: "US-Atlanta",
                    KS: "US-Atlanta",
                    KY: "US-Atlanta",
                    LA: "US-Atlanta",
                    ME: "US-Atlanta",
                    MD: "US-Atlanta",
                    MA: "US-Atlanta",
                    MI: "US-Atlanta",
                    MN: "US-Fremont",
                    MS: "US-Atlanta",
                    MO: "US-Atlanta",
                    MT: "US-Fremont",
                    NE: "US-Fremont",
                    NV: "US-Fremont",
                    NH: "US-Atlanta",
                    NJ: "US-Atlanta",
                    NM: "US-Fremont",
                    NY: "US-Atlanta",
                    NC: "US-Atlanta",
                    ND: "US-Fremont",
                    OH: "US-Atlanta",
                    OK: "US-Atlanta",
                    OR: "US-Fremont",
                    PA: "US-Atlanta",
                    RI: "US-Atlanta",
                    SC: "US-Atlanta",
                    SD: "US-Fremont",
                    TN: "US-Atlanta",
                    TX: "US-Atlanta",
                    UT: "US-Fremont",
                    VT: "US-Atlanta",
                    VA: "US-Atlanta",
                    WA: "US-Fremont",
                    WV: "US-Atlanta",
                    WI: "US-Atlanta",
                    WY: "US-Fremont",
                    DC: "US-Atlanta",
                    AS: "US-Atlanta",
                    GU: "US-Atlanta",
                    MP: "US-Atlanta",
                    PR: "US-Atlanta",
                    UM: "US-Atlanta",
                    VI: "US-Atlanta"
                },
                UM: "SG-Singapore",
                VI: "US-Atlanta",
                UY: "BR-Brazil",
                UZ: "JP-Tokyo",
                VU: "SG-Singapore",
                VE: "BR-Brazil",
                VN: "JP-Tokyo",
                WF: "SG-Singapore",
                EH: "EU-London",
                YE: "JP-Tokyo",
                ZM: "EU-London",
                ZW: "EU-London"
            };
            f.connect = Ha;
            var ba = 500,
                La = -1,
                Ma = -1,
                x = null,
                z = 1,
                ja = null,
                M = {},
                Sa = "poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;chaplin;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina;scotland;sir;romania;belarus;wojak;doge;nasa;byzantium;imperial japan;french kingdom;somalia;turkey;mars;pokerface;8;irs;receita federal;facebook".split(";"),
                gb = ["8", "nasa"],
                hb = ["m'blob"];
            Ka.prototype = {
                id: 0,
                a: null,
                l: null,
                name: null,
                k: null,
                J: null,
                x: 0,
                y: 0,
                size: 0,
                p: 0,
                q: 0,
                o: 0,
                D: 0,
                F: 0,
                n: 0,
                W: 0,
                L: 0,
                ja: 0,
                ba: 0,
                A: !1,
                d: !1,
                j: !1,
                M: !0,
                S: function() {
                    var a;
                    for (a = 0; a < v.length; a++)
                        if (v[a] == this) {
                            v.splice(a, 1);
                            break
                        }
                    delete A[this.id];
                    a = p.indexOf(this); - 1 != a && (ta = !0, p.splice(a, 1));
                    a = G.indexOf(this.id); - 1 != a && G.splice(a, 1);
                    this.A = !0;
                    I.push(this)
                },
                h: function() {
                    return Math.max(~~(.3 * this.size), 24)
                },
                Z: function(a) {
                    if (this.name = a) null == this.k ? this.k = new ka(this.h(), "#FFFFFF", !0, "#000000") : this.k.H(this.h()), this.k.u(this.name)
                },
                R: function() {
                    for (var a = this.C(); this.a.length > a;) {
                        var b = ~~(Math.random() * this.a.length);
                        this.a.splice(b, 1);
                        this.l.splice(b, 1)
                    }
                    0 == this.a.length && 0 < a && (this.a.push({
                        Q: this,
                        e: this.size,
                        x: this.x,
                        y: this.y
                    }), this.l.push(Math.random() - .5));
                    for (; this.a.length < a;) {
                        var b = ~~(Math.random() * this.a.length),
                            c = this.a[b];
                        this.a.splice(b, 0, {
                            Q: this,
                            e: c.e,
                            x: c.x,
                            y: c.y
                        });
                        this.l.splice(b, 0, this.l[b])
                    }
                },
                C: function() {
                    if (0 == this.id) return 16;
                    var a = 10;
                    20 > this.size && (a = 0);
                    this.d && (a = 30);
                    var b = this.size;
                    this.d || (b *= k);
                    b *= z;
                    this.W & 32 && (b *= .25);
                    return ~~Math.max(b, a)
                },
                ha: function() {
                    this.R();
                    for (var a = this.a, b = this.l, c = a.length, d = 0; d < c; ++d) {
                        var e = b[(d - 1 + c) % c],
                            m = b[(d + 1) % c];
                        b[d] += (Math.random() - .5) * (this.j ? 3 : 1);
                        b[d] *= .7;
                        10 < b[d] && (b[d] = 10); - 10 > b[d] && (b[d] = -10);
                        b[d] = (e + m + 8 * b[d]) / 10
                    }
                    for (var h = this, g = this.d ? 0 : (this.id / 1E3 + H / 1E4) % (2 * Math.PI), d = 0; d < c; ++d) {
                        var f = a[d].e,
                            e = a[(d - 1 + c) % c].e,
                            m = a[(d + 1) % c].e;
                        if (15 < this.size && null != O && 20 < this.size * k && 0 != this.id) {
                            var l = !1,
                                p = a[d].x,
                                q = a[d].y;
                            O.ia(p -
                                5, q - 5, 10, 10,
                                function(a) {
                                    a.Q != h && 25 > (p - a.x) * (p - a.x) + (q - a.y) * (q - a.y) && (l = !0)
                                });
                            !l && (a[d].x < ea || a[d].y < fa || a[d].x > ga || a[d].y > ha) && (l = !0);
                            l && (0 < b[d] && (b[d] = 0), b[d] -= 1)
                        }
                        f += b[d];
                        0 > f && (f = 0);
                        f = this.j ? (19 * f + this.size) / 20 : (12 * f + this.size) / 13;
                        a[d].e = (e + m + 8 * f) / 10;
                        e = 2 * Math.PI / c;
                        m = this.a[d].e;
                        this.d && 0 == d % 2 && (m += 5);
                        a[d].x = this.x + Math.cos(e * d + g) * m;
                        a[d].y = this.y + Math.sin(e * d + g) * m
                    }
                },
                K: function() {
                    if (0 == this.id) return 1;
                    var a;
                    a = (H - this.L) / 120;
                    a = 0 > a ? 0 : 1 < a ? 1 : a;
                    var b = 0 > a ? 0 : 1 < a ? 1 : a;
                    this.h();
                    if (this.A && 1 <= b) {
                        var c = I.indexOf(this); - 1 != c && I.splice(c, 1)
                    }
                    this.x = a * (this.D - this.p) + this.p;
                    this.y = a * (this.F - this.q) + this.q;
                    this.size = b * (this.n - this.o) + this.o;
                    return b
                },
                I: function() {
                    return 0 == this.id ? !0 : this.x + this.size + 40 < t - r / 2 / k || this.y + this.size + 40 < u - s / 2 / k || this.x - this.size - 40 > t + r / 2 / k || this.y - this.size - 40 > u + s / 2 / k ? !1 : !0
                },
                T: function(a) {
                    if (this.I()) {
                        var b = 0 != this.id && !this.d && !this.j && .4 > k;
                        5 > this.C() && (b = !0);
                        if (this.M && !b)
                            for (var c = 0; c < this.a.length; c++) this.a[c].e = this.size;
                        this.M = b;
                        a.save();
                        this.ba = H;
                        c = this.K();
                        this.A && (a.globalAlpha *= 1 - c);
                        a.lineWidth = 10;
                        a.lineCap = "round";
                        a.lineJoin = this.d ? "miter" : "round";
                        xa ? (a.fillStyle = "#FFFFFF", a.strokeStyle = "#AAAAAA") : (a.fillStyle = this.color, a.strokeStyle = this.color);
                        if (b) a.beginPath(), a.arc(this.x, this.y, this.size + 5, 0, 2 * Math.PI, !1);
                        else {
                            this.ha();
                            a.beginPath();
                            var d = this.C();
                            a.moveTo(this.a[0].x, this.a[0].y);
                            for (c = 1; c <= d; ++c) {
                                var e = c % d;
                                a.lineTo(this.a[e].x, this.a[e].y)
                            }
                        }
                        a.closePath();
                        d = this.name.toLowerCase();
                        !this.j && Oa && ":teams" != P ? -1 != Sa.indexOf(d) ? (M.hasOwnProperty(d) || (M[d] = new Image, M[d].src = "skins/" + d + ".png"), c = 0 != M[d].width && M[d].complete ? M[d] : null) : c = null : c = null;
                        c = (e = c) ? -1 != hb.indexOf(d) : !1;
                        b || a.stroke();
                        a.fill();
                        null == e || c || (a.save(), a.clip(), a.drawImage(e, this.x - this.size, this.y - this.size, 2 * this.size, 2 * this.size), a.restore());
                        (xa || 15 < this.size) && !b && (a.strokeStyle = "#000000", a.globalAlpha *= .1, a.stroke());
                        a.globalAlpha = 1;
                        null != e && c && a.drawImage(e, this.x - 2 * this.size, this.y - 2 * this.size, 4 * this.size, 4 * this.size);
                        c = -1 != p.indexOf(this);
                        if (0 != this.id) {
                            b = ~~this.y;
                            if ((la || c) && this.name && this.k && (null == e || -1 == gb.indexOf(d))) {
                                e = this.k;
                                e.u(this.name);
                                e.H(this.h());
                                d = Math.ceil(10 * k) / 10;
                                e.$(d);
                                var e = e.G(),
                                    m = ~~(e.width / d),
                                    h = ~~(e.height / d);
                                a.drawImage(e, ~~this.x - ~~(m / 2), b - ~~(h / 2), m, h);
                                b += e.height / 2 / d + 4
                            }
                            Pa && (c || 0 == p.length && (!this.d || this.j) && 20 < this.size) && (null == this.J && (this.J = new ka(this.h() / 2, "#FFFFFF", !0, "#000000")), c = this.J, c.H(this.h() / 2), c.u(~~(this.size * this.size / 100)), d = Math.ceil(10 * k) / 10, c.$(d), e = c.G(), m = ~~(e.width / d), h = ~~(e.height / d), a.drawImage(e, ~~this.x - ~~(m / 2), b - ~~(h / 2),
                                m, h))
                        }
                        a.restore()
                    }
                }
            };
            ka.prototype = {
                w: "",
                N: "#000000",
                P: !1,
                s: "#000000",
                r: 16,
                m: null,
                O: null,
                g: !1,
                v: 1,
                H: function(a) {
                    this.r != a && (this.r = a, this.g = !0)
                },
                $: function(a) {
                    this.v != a && (this.v = a, this.g = !0)
                },
                setStrokeColor: function(a) {
                    this.s != a && (this.s = a, this.g = !0)
                },
                u: function(a) {
                    a != this.w && (this.w = a, this.g = !0)
                },
                G: function() {
                    null == this.m && (this.m = document.createElement("canvas"), this.O = this.m.getContext("2d"));
                    if (this.g) {
                        this.g = !1;
                        var a = this.m,
                            b = this.O,
                            c = this.w,
                            d = this.v,
                            e = this.r,
                            m = e + "px Ubuntu";
                        b.font = m;
                        var h = ~~(.2 * e);
                        a.width = (b.measureText(c).width + 6) * d;
                        a.height = (e + h) * d;
                        b.font = m;
                        b.scale(d, d);
                        b.globalAlpha = 1;
                        b.lineWidth = 3;
                        b.strokeStyle = this.s;
                        b.fillStyle = this.N;
                        this.P && b.strokeText(c, 3, e - h / 2);
                        b.fillText(c, 3, e - h / 2)
                    }
                    return this.m
                }
            };
            Date.now || (Date.now = function() {
                return (new Date).getTime()
            });
            var Va = {
                ca: function(a) {
                    function b(a, b, c, d, e) {
                        this.x = a;
                        this.y = b;
                        this.f = c;
                        this.c = d;
                        this.depth = e;
                        this.items = [];
                        this.b = []
                    }
                    var c = a.da || 2,
                        d = a.ea || 4;
                    b.prototype = {
                        x: 0,
                        y: 0,
                        f: 0,
                        c: 0,
                        depth: 0,
                        items: null,
                        b: null,
                        B: function(a) {
                            for (var b = 0; b < this.items.length; ++b) {
                                var c = this.items[b];
                                if (c.x >= a.x && c.y >= a.y && c.x < a.x + a.f && c.y < a.y + a.c) return !0
                            }
                            if (0 != this.b.length) {
                                var d = this;
                                return this.V(a, function(b) {
                                    return d.b[b].B(a)
                                })
                            }
                            return !1
                        },
                        t: function(a, b) {
                            for (var c = 0; c < this.items.length; ++c) b(this.items[c]);
                            if (0 != this.b.length) {
                                var d = this;
                                this.V(a, function(c) {
                                    d.b[c].t(a, b)
                                })
                            }
                        },
                        i: function(a) {
                            0 != this.b.length ? this.b[this.U(a)].i(a) : this.items.length >= c && this.depth < d ? (this.aa(), this.b[this.U(a)].i(a)) : this.items.push(a)
                        },
                        U: function(a) {
                            return a.x < this.x +
                                this.f / 2 ? a.y < this.y + this.c / 2 ? 0 : 2 : a.y < this.y + this.c / 2 ? 1 : 3
                        },
                        V: function(a, b) {
                            return a.x < this.x + this.f / 2 && (a.y < this.y + this.c / 2 && b(0) || a.y >= this.y + this.c / 2 && b(2)) || a.x >= this.x + this.f / 2 && (a.y < this.y + this.c / 2 && b(1) || a.y >= this.y + this.c / 2 && b(3)) ? !0 : !1
                        },
                        aa: function() {
                            var a = this.depth + 1,
                                c = this.f / 2,
                                d = this.c / 2;
                            this.b.push(new b(this.x, this.y, c, d, a));
                            this.b.push(new b(this.x + c, this.y, c, d, a));
                            this.b.push(new b(this.x, this.y + d, c, d, a));
                            this.b.push(new b(this.x + c, this.y + d, c, d, a));
                            a = this.items;
                            this.items = [];
                            for (c = 0; c < a.length; c++) this.i(a[c])
                        },
                        clear: function() {
                            for (var a = 0; a < this.b.length; a++) this.b[a].clear();
                            this.items.length = 0;
                            this.b.length = 0
                        }
                    };
                    var e = {
                        x: 0,
                        y: 0,
                        f: 0,
                        c: 0
                    };
                    return {
                        root: new b(a.X, a.Y, a.fa - a.X, a.ga - a.Y, 0),
                        i: function(a) {
                            this.root.i(a)
                        },
                        t: function(a, b) {
                            this.root.t(a, b)
                        },
                        ia: function(a, b, c, d, f) {
                            e.x = a;
                            e.y = b;
                            e.f = c;
                            e.c = d;
                            this.root.t(e, f)
                        },
                        B: function(a) {
                            return this.root.B(a)
                        },
                        clear: function() {
                            this.root.clear()
                        }
                    }
                }
            };
            f.onload = Ta
        }
    }

	var ai=f.ai=new Ai(
			function(x1,y2){Y=x1;Z=y2;N()},
			function(){D(17)},
			function(){D(21)})

	f.skinNames=Sa

	var onUpdate=$a
	$a=function(a,c){
		onUpdate(a,c)
		ai.tick(v,p,J) //blobs,myblobs,score
	}
	var onDeath=Ba
	Ba=function(a){
		F=null
	}

	var drawLeaderboard=Ja
	Ja=function(){
		if(onDrawLeaderboard(B,G,y)){
			drawLeaderboard()
		}
	}

	cb=function(){}
})(window, window.jQuery);
