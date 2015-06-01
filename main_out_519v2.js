$('#canvas').after($('#canvas').clone().attr('id','canvas-2')).remove();
(function(self, $) {
  /**
   * @return {undefined}
   */
  function init() {
    /** @type {boolean} */
    ea = true;
    update();
    setInterval(update, 18E4);
    /** @type {(HTMLElement|null)} */
    canvas = cv = document.getElementById("canvas-2");
    ctx = canvas.getContext("2d");
    /**
     * @param {Event} e
     * @return {undefined}
     */
    canvas.onmousedown = function(e) {
      if (options) {
        /** @type {number} */
        var z0 = e.clientX - (5 + width / 5 / 2);
        /** @type {number} */
        var z1 = e.clientY - (5 + width / 5 / 2);
        if (Math.sqrt(z0 * z0 + z1 * z1) <= width / 5 / 2) {
          emit();
          registerEvent(17);
          return;
        }
      }
      mx = e.clientX;
      y = e.clientY;
      triggerObjectAt();
      emit();
    };
    /**
     * @param {Event} e
     * @return {undefined}
     */
    canvas.onmousemove = function(e) {
      mx = e.clientX;
      y = e.clientY;
      triggerObjectAt();
    };
    /**
     * @param {?} evt
     * @return {undefined}
     */
    canvas.onmouseup = function(evt) {
    };
    /** @type {boolean} */
    var b = false;
    /** @type {boolean} */
    var a = false;
    /** @type {boolean} */
    var all = false;
    /**
     * @param {?} e
     * @return {undefined}
     */
    self.onkeydown = function(e) {
      if (!(32 != e.keyCode)) {
        if (!b) {
          emit();
          registerEvent(17);
          /** @type {boolean} */
          b = true;
        }
      }
      if (!(81 != e.keyCode)) {
        if (!a) {
          registerEvent(18);
          /** @type {boolean} */
          a = true;
        }
      }
      if (!(87 != e.keyCode)) {
        if (!all) {
          emit();
          registerEvent(21);
          /** @type {boolean} */
          all = true;
        }
      }
      if (27 == e.keyCode) {
        post(true);
      }
    };
    /**
     * @param {?} event
     * @return {undefined}
     */
    self.onkeyup = function(event) {
      if (32 == event.keyCode) {
        /** @type {boolean} */
        b = false;
      }
      if (87 == event.keyCode) {
        /** @type {boolean} */
        all = false;
      }
      if (81 == event.keyCode) {
        if (a) {
          registerEvent(19);
          /** @type {boolean} */
          a = false;
        }
      }
    };
    /**
     * @return {undefined}
     */
    self.onblur = function() {
      registerEvent(19);
      /** @type {boolean} */
      all = a = b = false;
    };
    /** @type {function (): undefined} */
    self.onresize = onResize;
    onResize();
    if (self.requestAnimationFrame) {
      self.requestAnimationFrame(anim);
    } else {
      setInterval(draw, 1E3 / 60);
    }
    //setInterval(emit, 40);
    if (currentValue) {
      $("#region").val(currentValue);
    }
    refresh();
    reset($("#region").val());
    if (null == ws) {
      if (currentValue) {
        connect();
      }
    }
    $("#overlays").show();
  }
  /**
   * @return {undefined}
   */
  function processData() {
    if (0.5 > ratio) {
      /** @type {null} */
      body = null;
    } else {
      /** @type {number} */
      var v = Number.POSITIVE_INFINITY;
      /** @type {number} */
      var j = Number.POSITIVE_INFINITY;
      /** @type {number} */
      var bottom = Number.NEGATIVE_INFINITY;
      /** @type {number} */
      var maxY = Number.NEGATIVE_INFINITY;
      /** @type {number} */
      var newDuration = 0;
      /** @type {number} */
      var i = 0;
      for (;i < arr.length;i++) {
        if (arr[i].shouldRender()) {
          /** @type {number} */
          newDuration = Math.max(arr[i].size, newDuration);
          /** @type {number} */
          v = Math.min(arr[i].x, v);
          /** @type {number} */
          j = Math.min(arr[i].y, j);
          /** @type {number} */
          bottom = Math.max(arr[i].x, bottom);
          /** @type {number} */
          maxY = Math.max(arr[i].y, maxY);
        }
      }
      body = QUAD.init({
        minX : v - (newDuration + 100),
        minY : j - (newDuration + 100),
        maxX : bottom + (newDuration + 100),
        maxY : maxY + (newDuration + 100)
      });
      /** @type {number} */
      i = 0;
      for (;i < arr.length;i++) {
        if (v = arr[i], v.shouldRender()) {
          /** @type {number} */
          j = 0;
          for (;j < v.points.length;++j) {
            body.insert(v.points[j]);
          }
        }
      }
    }
  }
  /**
   * @return {undefined}
   */
  function triggerObjectAt() {
    value = (mx - width / 2) / ratio + left;
    x = (y - height / 2) / ratio + t;
  }
  /**
   * @return {undefined}
   */
  function update() {
    if (null == old) {
      old = {};
      $("#region").children().each(function() {
        var option = $(this);
        var name = option.val();
        if (name) {
          old[name] = option.text();
        }
      });
    }
    $.get("http://m.agar.io/info", function(b) {
      var testSource = {};
      var name;
      for (name in b.regions) {
        /** @type {string} */
        var sourceName = name.split(":")[0];
        testSource[sourceName] = testSource[sourceName] || 0;
        testSource[sourceName] += b.regions[name].numPlayers;
      }
      for (name in testSource) {
        $('#region option[value="' + name + '"]').text(old[name] + " (" + testSource[name] + " players)");
      }
    }, "json");
  }
  /**
   * @return {undefined}
   */
  function _hide() {
    $("#adsBottom").hide();
    $("#overlays").hide();
    refresh();
  }
  /**
   * @param {string} value
   * @return {undefined}
   */
  function reset(value) {
    if (value) {
      if (value != currentValue) {
        if ($("#region").val() != value) {
          $("#region").val(value);
        }
        currentValue = self.localStorage.location = value;
        $(".region-message").hide();
        $(".region-message." + value).show();
        $(".btn-needs-server").prop("disabled", false);
        if (ea) {
          connect();
        }
      }
    }
  }
  /**
   * @param {boolean} recurring
   * @return {undefined}
   */
  function post(recurring) {
    /** @type {null} */
    n = null;
    $("#overlays").fadeIn(recurring ? 200 : 3E3);
    if (!recurring) {
      $("#adsBottom").fadeIn(3E3);
    }
  }
  /**
   * @return {undefined}
   */
  function refresh() {
    if ($("#region").val()) {
      self.localStorage.location = $("#region").val();
    } else {
      if (self.localStorage.location) {
        $("#region").val(self.localStorage.location);
      }
    }
    if ($("#region").val()) {
      $("#locationKnown").append($("#region"));
    } else {
      $("#locationUnknown").append($("#region"));
    }
  }
  /**
   * @return {undefined}
   */
  function next() {
    console.log("Find " + currentValue + dest);
    $.ajax("http://m.agar.io/", {
      /**
       * @return {undefined}
       */
      error : function() {
        setTimeout(next, 1E3);
      },
      /**
       * @param {string} status
       * @return {undefined}
       */
      success : function(status) {
        status = status.split("\n");
		$('#ip-address').html(status[0])
        open("ws://" + status[0]);
      },
      dataType : "text",
      method : "POST",
      cache : false,
      crossDomain : true,
      data : currentValue + dest || "?"
    });
  }
  /**
   * @return {undefined}
   */
  function connect() {
    if (ea) {
      if (currentValue) {
        $("#connecting").show();
        next();
      }
    }
  }
  /**
   * @param {string} url
   * @return {undefined}
   */
  function open(url) {
    if (ws) {
      /** @type {null} */
      ws.onopen = null;
      /** @type {null} */
      ws.onmessage = null;
      /** @type {null} */
      ws.onclose = null;
      try {
        ws.close();
      } catch (b) {
      }
      /** @type {null} */
      ws = null;
    }
    /** @type {Array} */
    params = [];
    /** @type {Array} */
    data = [];
    nodes = {};
    /** @type {Array} */
    arr = [];
    /** @type {Array} */
    sprites = [];
    /** @type {Array} */
    users = [];
    /** @type {null} */
    img = angles = null;
    /** @type {number} */
    closingAnimationTime = 0;
    console.log("Connecting to " + url);
    /** @type {WebSocket} */
    ws = new WebSocket(url);
    /** @type {string} */
    ws.binaryType = "arraybuffer";
    /** @type {function (ArrayBuffer): undefined} */
    ws.onopen = listener;
    /** @type {function (number): undefined} */
    ws.onmessage = parse;
    /** @type {function (?): undefined} */
    ws.onclose = report;
    /**
     * @return {undefined}
     */
    ws.onerror = function() {
      console.log("socket error");
    };
  }
  /**
   * @param {ArrayBuffer} data
   * @return {undefined}
   */
  function listener(data) {
    /** @type {number} */
    backoff = 500;
    $("#connecting").hide();
    console.log("socket open");
    /** @type {ArrayBuffer} */
    data = new ArrayBuffer(5);
    /** @type {DataView} */
    var view = new DataView(data);
    view.setUint8(0, 254);
    view.setUint32(1, 4, true);
    ws.send(data);
    /** @type {ArrayBuffer} */
    data = new ArrayBuffer(5);
    /** @type {DataView} */
    view = new DataView(data);
    view.setUint8(0, 255);
    view.setUint32(1, 1, true);
    ws.send(data);
    write();
  }
  /**
   * @param {?} failing_message
   * @return {undefined}
   */
  function report(failing_message) {
    console.log("socket close");
    setTimeout(connect, backoff);
    backoff *= 1.5;
  }
  /**
   * @param {number} n
   * @return {undefined}
   */
  function parse(n) {
    /**
     * @return {?}
     */
    function encode() {
      /** @type {string} */
      var str = "";
      for (;;) {
        /** @type {number} */
        var b = d.getUint16(offset, true);
        offset += 2;
        if (0 == b) {
          break;
        }
        str += String.fromCharCode(b);
      }
      return str;
    }
    /** @type {number} */
    var offset = 1;
    /** @type {DataView} */
    var d = new DataView(n.data);
    switch(d.getUint8(0)) {
      case 16:
        run(d);
        break;
      case 17:
        /** @type {number} */
        l = d.getFloat32(1, true);
        /** @type {number} */
        b = d.getFloat32(5, true);
        /** @type {number} */
        px = d.getFloat32(9, true);
        break;
      case 20:
        /** @type {Array} */
        data = [];
        /** @type {Array} */
        params = [];
        break;
      case 32:
        params.push(d.getUint32(1, true));
        break;
      case 49:
        if (null != angles) {
          break;
        }
        /** @type {number} */
        n = d.getUint32(offset, true);
        offset += 4;
        /** @type {Array} */
        users = [];
        /** @type {number} */
        var i = 0;
        for (;i < n;++i) {
          /** @type {number} */
          var token = d.getUint32(offset, true);
          offset = offset + 4;
          users.push({
            id : token,
            name : encode()
          });
        }
        render();
        break;
      case 50:
        /** @type {Array} */
        angles = [];
        /** @type {number} */
        n = d.getUint32(offset, true);
        offset += 4;
        /** @type {number} */
        i = 0;
        for (;i < n;++i) {
          angles.push(d.getFloat32(offset, true));
          offset += 4;
        }
        render();
        break;
      case 64:
        /** @type {number} */
        max = d.getFloat64(1, true);
        /** @type {number} */
        low = d.getFloat64(9, true);
        /** @type {number} */
        min = d.getFloat64(17, true);
        /** @type {number} */
        high = d.getFloat64(25, true);
        /** @type {number} */
        l = (min + max) / 2;
        /** @type {number} */
        b = (high + low) / 2;
        /** @type {number} */
        px = 1;
        if (0 == data.length) {
          /** @type {number} */
          left = l;
          /** @type {number} */
          t = b;
          /** @type {number} */
          ratio = px;
        }
      ;
    }
  }
  /**
   * @param {DataView} buffer
   * @return {undefined}
   */
  function run(buffer) {
    /** @type {number} */
    timestamp = +new Date;
    /** @type {number} */
    var len = Math.random();
    /** @type {number} */
    var offset = 1;
    /** @type {boolean} */
    ia = false;
    var n = buffer.getUint16(offset, true);
    /** @type {number} */
    offset = offset + 2;
    /** @type {number} */
    var i = 0;
    for (;i < n;++i) {
      var current = nodes[buffer.getUint32(offset, true)];
      var that = nodes[buffer.getUint32(offset + 4, true)];
      /** @type {number} */
      offset = offset + 8;
      if (current) {
        if (that) {
          that.destroy();
          that.ox = that.x;
          that.oy = that.y;
          that.oSize = that.size;
          that.nx = current.x;
          that.ny = current.y;
          that.nSize = that.size;
          /** @type {number} */
          that.updateTime = timestamp;
        }
      }
    }
    /** @type {number} */
    i = 0;
    for (;;) {
      n = buffer.getUint32(offset, true);
      offset += 4;
      if (0 == n) {
        break;
      }
      ++i;
      var chunk;
      current = buffer.getInt16(offset, true);
      /** @type {number} */
      offset = offset + 2;
      that = buffer.getInt16(offset, true);
      /** @type {number} */
      offset = offset + 2;
      chunk = buffer.getInt16(offset, true);
      /** @type {number} */
      offset = offset + 2;
      var m = buffer.getUint8(offset++);
      var compassResult = buffer.getUint8(offset++);
      var b = buffer.getUint8(offset++);
      /** @type {string} */
      m = (m << 16 | compassResult << 8 | b).toString(16);
      for (;6 > m.length;) {
        /** @type {string} */
        m = "0" + m;
      }
      /** @type {string} */
      m = "#" + m;
      var self = buffer.getUint8(offset++);
      /** @type {boolean} */
      compassResult = !!(self & 1);
      /** @type {boolean} */
      b = !!(self & 16);
      if (self & 2) {
        offset += 4;
      }
      if (self & 4) {
        offset += 8;
      }
      if (self & 8) {
        offset += 16;
      }
      var c;
      /** @type {string} */
      self = "";
      for (;;) {
        c = buffer.getUint16(offset, true);
        offset += 2;
        if (0 == c) {
          break;
        }
        self += String.fromCharCode(c);
      }
      /** @type {string} */
      c = self;
      /** @type {null} */
      self = null;
      if (nodes.hasOwnProperty(n)) {
        self = nodes[n];
        self.updatePos();
        self.ox = self.x;
        self.oy = self.y;
        self.oSize = self.size;
        /** @type {string} */
        self.color = m;
      } else {
        self = new move(n, current, that, chunk, m, c);
        self.pX = current;
        self.pY = that;
      }
      /** @type {boolean} */
      self.isVirus = compassResult;
      /** @type {boolean} */
      self.isAgitated = b;
      self.nx = current;
      self.ny = that;
      self.nSize = chunk;
      /** @type {number} */
      self.updateCode = len;
      /** @type {number} */
      self.updateTime = timestamp;
      if (-1 != params.indexOf(n)) {
        if (-1 == data.indexOf(self)) {
          /** @type {string} */
          document.getElementById("overlays").style.display = "none";
          data.push(self);
          if (1 == data.length) {
            left = self.x;
            t = self.y;
          }
        }
      }
    }
    len = buffer.getUint32(offset, true);
    offset += 4;
    /** @type {number} */
    i = 0;
    for (;i < len;i++) {
      n = buffer.getUint32(offset, true);
      offset += 4;
      self = nodes[n];
      if (null != self) {
        self.destroy();
      }
    }
    if (ia) {
      if (0 == data.length) {
        post(false);
      }
    }
  }
  /**
   * @return {undefined}
   */
  function emit() {
    if (queue()) {
      /** @type {number} */
      var z0 = mx - width / 2;
      /** @type {number} */
      var z1 = y - height / 2;
      if (!(64 > z0 * z0 + z1 * z1)) {
        if (!(el == value && type == x)) {
          el = value;
          type = x;
          /** @type {ArrayBuffer} */
          z0 = new ArrayBuffer(21);
          /** @type {DataView} */
          z1 = new DataView(z0);
          z1.setUint8(0, 16);
          z1.setFloat64(1, value, true);
          z1.setFloat64(9, x, true);
          z1.setUint32(17, 0, true);
          ws.send(z0);
        }
      }
    }
  }
  /**
   * @return {undefined}
   */
  function write() {
    if (queue() && null != n) {
      /** @type {ArrayBuffer} */
      var buf = new ArrayBuffer(1 + 2 * n.length);
      /** @type {DataView} */
      var view = new DataView(buf);
      view.setUint8(0, 0);
      /** @type {number} */
      var i = 0;
      for (;i < n.length;++i) {
        view.setUint16(1 + 2 * i, n.charCodeAt(i), true);
      }
      ws.send(buf);
    }
  }
  /**
   * @return {?}
   */
  function queue() {
    return null != ws && ws.readyState == ws.OPEN;
  }
  /**
   * @param {number} expectedNumberOfNonCommentArgs
   * @return {undefined}
   */
  function registerEvent(expectedNumberOfNonCommentArgs) {
    if (queue()) {
      /** @type {ArrayBuffer} */
      var buf = new ArrayBuffer(1);
      (new DataView(buf)).setUint8(0, expectedNumberOfNonCommentArgs);
      ws.send(buf);
    }
  }
  /**
   * @return {undefined}
   */
  function anim() {
    draw();
    self.requestAnimationFrame(anim);
  }
  /**
   * @return {undefined}
   */
  function onResize() {
    /** @type {number} */
    width = self.innerWidth;
    /** @type {number} */
    height = self.innerHeight;
    /** @type {number} */
    cv.width = canvas.width = width;
    /** @type {number} */
    cv.height = canvas.height = height;
    draw();
  }
  /**
   * @return {undefined}
   */
  function build() {
    if (0 != data.length) {
      /** @type {number} */
      var offset = 0;
      /** @type {number} */
      var i = 0;
      for (;i < data.length;i++) {
        offset += data[i].size;
      }
      /** @type {number} */
      offset = Math.pow(Math.min(64 / offset, 1), 0.4) * Math.max(height / 1080, width / 1920);
      /** @type {number} */
      ratio = (9 * ratio + offset) / 10;
    }
  }
  /**
   * @return {undefined}
   */
  function draw() {
    /** @type {number} */
    var tick = +new Date;
    ++La;
    /** @type {number} */
    timestamp = +new Date;
    if (0 < data.length) {
      build();
      /** @type {number} */
      var w = 0;
      /** @type {number} */
      var d = 0;
      /** @type {number} */
      var i = 0;
      for (;i < data.length;i++) {
        data[i].updatePos();
        w += data[i].x / data.length;
        d += data[i].y / data.length;
      }
      /** @type {number} */
      l = w;
      /** @type {number} */
      b = d;
      px = ratio;
      /** @type {number} */
      left = (left + w) / 2;
      /** @type {number} */
      t = (t + d) / 2;
    } else {
      /** @type {number} */
      left = (29 * left + l) / 30;
      /** @type {number} */
      t = (29 * t + b) / 30;
      /** @type {number} */
      ratio = (9 * ratio + px) / 10;
    }
    processData();
    triggerObjectAt();
    ctx.clearRect(0, 0, width, height);
    /** @type {string} */
    ctx.fillStyle = color ? "#111111" : "#F2FBFF";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    /** @type {string} */
    ctx.strokeStyle = color ? "#AAAAAA" : "#000000";
    /** @type {number} */
    ctx.globalAlpha = 0.2;
    ctx.scale(ratio, ratio);
    /** @type {number} */
    w = width / ratio;
    /** @type {number} */
    d = height / ratio;
    /** @type {number} */
    i = -0.5 + (-left + w / 2) % 50;
    for (;i < w;i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, d);
      ctx.stroke();
    }
    /** @type {number} */
    i = -0.5 + (-t + d / 2) % 50;
    for (;i < d;i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    ctx.restore();
    arr.sort(function(a, b) {
      return a.size == b.size ? a.id - b.id : a.size - b.size;
    });
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(ratio, ratio);
    ctx.translate(-left, -t);
    /** @type {number} */
    i = 0;
    for (;i < sprites.length;i++) {
      sprites[i].draw();
    }
    /** @type {number} */
    i = 0;
    for (;i < arr.length;i++) {
      arr[i].draw();
    }
	ai.draw(ctx)
    ctx.restore();
    if (img) {
      if (img.width) {
        ctx.drawImage(img, width - img.width - 10, 10);
      }
    }
    /** @type {number} */
    closingAnimationTime = Math.max(closingAnimationTime, getHeight());
    if (0 != closingAnimationTime) {
      if (null == button) {
        button = new SVGPlotFunction(24, "#FFFFFF");
      }
      button.setValue("Score: " + ~~(closingAnimationTime / 100));
      d = button.render();
      w = d.width;
      /** @type {number} */
      ctx.globalAlpha = 0.2;
      /** @type {string} */
      ctx.fillStyle = "#000000";
      ctx.fillRect(10, height - 10 - 24 - 10, w + 10, 34);
      /** @type {number} */
      ctx.globalAlpha = 1;
      ctx.drawImage(d, 15, height - 10 - 24 - 5);
    }
    clear();
    /** @type {number} */
    tick = +new Date - tick;
    if (tick > 1E3 / 60) {
      n_players -= 0.01;
    } else {
      if (tick < 1E3 / 65) {
        n_players += 0.01;
      }
    }
    if (0.4 > n_players) {
      /** @type {number} */
      n_players = 0.4;
    }
    if (1 < n_players) {
      /** @type {number} */
      n_players = 1;
    }
  }
  /**
   * @return {undefined}
   */
  function clear() {
    if (options && copy.width) {
      /** @type {number} */
      var dim = width / 5;
      ctx.drawImage(copy, 5, 5, dim, dim);
    }
  }
  /**
   * @return {?}
   */
  function getHeight() {
    /** @type {number} */
    var value = 0;
    /** @type {number} */
    var byteIndex = 0;
    for (;byteIndex < data.length;byteIndex++) {
      value += data[byteIndex].nSize * data[byteIndex].nSize;
    }
    return value;
  }
  /**
   * @return {undefined}
   */
  function render() {
    /** @type {null} */
    img = null;
    if (null != angles || 0 != users.length) {
      if (null != angles || $timeout) {
        /** @type {Element} */
        img = document.createElement("canvas");
        var ctx = img.getContext("2d");
        /** @type {number} */
        var i = 60;
        /** @type {number} */
        i = null == angles ? i + 24 * users.length : i + 180;
        /** @type {number} */
        var d = Math.min(200, 0.3 * width) / 200;
        /** @type {number} */
        img.width = 200 * d;
        /** @type {number} */
        img.height = i * d;
        ctx.scale(d, d);
        /** @type {number} */
        ctx.globalAlpha = 0.4;
        /** @type {string} */
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 200, i);
        /** @type {number} */
        ctx.globalAlpha = 1;
        /** @type {string} */
        ctx.fillStyle = "#FFFFFF";
        /** @type {null} */
        d = null;
        /** @type {string} */
        d = "Leaderboard";
        /** @type {string} */
        ctx.font = "30px Ubuntu";
        ctx.fillText(d, 100 - ctx.measureText(d).width / 2, 40);
        if (null == angles) {
          /** @type {string} */
          ctx.font = "20px Ubuntu";
          /** @type {number} */
          i = 0;
          for (;i < users.length;++i) {
            d = users[i].name || "An unnamed cell";
            if (!$timeout) {
              /** @type {string} */
              d = "An unnamed cell";
            }
            if (-1 != params.indexOf(users[i].id)) {
              if (data[0].name) {
                d = data[0].name;
              }
              /** @type {string} */
              ctx.fillStyle = "#FFAAAA";
            } else {
              /** @type {string} */
              ctx.fillStyle = "#FFFFFF";
            }
            /** @type {string} */
            d = i + 1 + ". " + d;
            ctx.fillText(d, 100 - ctx.measureText(d).width / 2, 70 + 24 * i);
          }
        } else {
          /** @type {number} */
          i = d = 0;
          for (;i < angles.length;++i) {
            /** @type {number} */
            angEnd = d + angles[i] * Math.PI * 2;
            ctx.fillStyle = cs[i + 1];
            ctx.beginPath();
            ctx.moveTo(100, 140);
            ctx.arc(100, 140, 80, d, angEnd, false);
            ctx.fill();
            /** @type {number} */
            d = angEnd;
          }
        }
      }
    }
  }
  /**
   * @param {?} id
   * @param {number} x
   * @param {number} y
   * @param {number} size
   * @param {string} color
   * @param {string} i
   * @return {undefined}
   */
  function move(id, x, y, size, color, i) {
    arr.push(this);
    nodes[id] = this;
    this.id = id;
    this.ox = this.x = x;
    this.oy = this.y = y;
    this.oSize = this.size = size;
    /** @type {string} */
    this.color = color;
    /** @type {Array} */
    this.points = [];
    /** @type {Array} */
    this.pointsAcc = [];
    this.createPoints();
    this.setName(i);
  }
  /**
   * @param {number} n
   * @param {?} Var
   * @param {?} stroke
   * @param {string} plot
   * @return {undefined}
   */
  function SVGPlotFunction(n, Var, stroke, plot) {
    if (n) {
      /** @type {number} */
      this._size = n;
    }
    if (Var) {
      this._color = Var;
    }
    /** @type {boolean} */
    this._stroke = !!stroke;
    if (plot) {
      /** @type {string} */
      this._strokeColor = plot;
    }
  }
  if ("agar.io" != self.location.hostname && ("localhost" != self.location.hostname && "10.10.2.13" != self.location.hostname)) {
    /** @type {string} */
    self.location = "http://agar.io/";
  } else {
    if (self.top != self) {
      /** @type {string} */
      self.top.location = "http://agar.io/";
    } else {
      var cv;
      var ctx;
      var canvas;
      var width;
      var height;
      /** @type {null} */
      var body = null;
      /** @type {null} */
      var ws = null;
      /** @type {number} */
      var left = 0;
      /** @type {number} */
      var t = 0;
      /** @type {Array} */
      var params = [];
      /** @type {Array} */
      var data = [];
      var nodes = {};
      /** @type {Array} */
      var arr = [];
      /** @type {Array} */
      var sprites = [];
      /** @type {Array} */
      var users = [];
      /** @type {number} */
      var mx = 0;
      /** @type {number} */
      var y = 0;
      /** @type {number} */
      var value = -1;
      /** @type {number} */
      var x = -1;
      /** @type {number} */
      var La = 0;
      /** @type {number} */
      var timestamp = 0;
      /** @type {null} */
      var n = null;
      /** @type {number} */
      var max = 0;
      /** @type {number} */
      var low = 0;
      /** @type {number} */
      var min = 1E4;
      /** @type {number} */
      var high = 1E4;
      /** @type {number} */
      var ratio = 1;
      /** @type {null} */
      var currentValue = null;
      /** @type {boolean} */
      var text = true;
      /** @type {boolean} */
      var $timeout = true;
      /** @type {boolean} */
      var doneResults = false;
      /** @type {boolean} */
      var ia = false;
      /** @type {number} */
      var closingAnimationTime = 0;
      /** @type {boolean} */
      var color = false;
      /** @type {boolean} */
      var result = false;
      /** @type {number} */
      var l = left = ~~((max + min) / 2);
      /** @type {number} */
      var b = t = ~~((low + high) / 2);
      /** @type {number} */
      var px = 1;
      /** @type {string} */
      var dest = "";
      /** @type {null} */
      var angles = null;
      /** @type {boolean} */
      var ea = false;
      /** @type {number} */
      var elem = 0;
      /** @type {Array} */
      var cs = ["#333333", "#FF3333", "#33FF33", "#3333FF"];
      /** @type {boolean} */
      var options = "ontouchstart" in self && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      /** @type {Image} */
      var copy = new Image;
      /** @type {string} */
      copy.src = "img/split.png";
      /** @type {Element} */
      elem = document.createElement("canvas");
      if ("undefined" == typeof console || ("undefined" == typeof DataView || ("undefined" == typeof WebSocket || (null == elem || (null == elem.getContext || null == self.localStorage))))) {
        alert("You browser does not support this game, we recommend you to use Firefox to play this");
      } else {
        /** @type {null} */
        var old = null;
        /**
         * @param {Function} step
         * @return {undefined}
         */
        self.setNick = function(step) {
          _hide();
          /** @type {Function} */
          n = step;
          write();
          /** @type {number} */
          closingAnimationTime = 0;
        };
        /** @type {function (string): undefined} */
        self.setRegion = reset;
        /**
         * @param {boolean} textAlt
         * @return {undefined}
         */
        self.setSkins = function(textAlt) {
          /** @type {boolean} */
          text = textAlt;
        };
        /**
         * @param {boolean} _$timeout_
         * @return {undefined}
         */
        self.setNames = function(_$timeout_) {
          /** @type {boolean} */
          $timeout = _$timeout_;
        };
        /**
         * @param {boolean} newColor
         * @return {undefined}
         */
        self.setDarkTheme = function(newColor) {
          /** @type {boolean} */
          color = newColor;
        };
        /**
         * @param {boolean} data
         * @return {undefined}
         */
        self.setColors = function(data) {
          /** @type {boolean} */
          doneResults = data;
        };
        /**
         * @param {boolean} subKey
         * @return {undefined}
         */
        self.setShowMass = function(subKey) {
          /** @type {boolean} */
          result = subKey;
        };
        /**
         * @return {undefined}
         */
        self.spectate = function() {
          /** @type {null} */
          n = null;
          registerEvent(1);
          _hide();
        };
        /**
         * @param {number} mat
         * @return {undefined}
         */
        self.setGameMode = function(mat) {
          if (mat != dest) {
            /** @type {number} */
            dest = mat;
            connect();
          }
        };
        if (null != self.localStorage) {
          if (null == self.localStorage.AB8) {
            /** @type {number} */
            self.localStorage.AB8 = 0 + ~~(100 * Math.random());
          }
          /** @type {number} */
          elem = +self.localStorage.AB8;
          /** @type {number} */
          self.ABGroup = elem;
        }
        $.get("http://gc.agar.io", function(prop) {
          var name = prop.split(" ");
          prop = name[0];
          name = name[1] || "";
          if (-1 == "DE IL PL HU BR AT".split(" ").indexOf(prop)) {
            numbers.push("nazi");
          }
          if (input.hasOwnProperty(prop)) {
            if ("string" == typeof input[prop]) {
              if (!currentValue) {
                reset(input[prop]);
              }
            } else {
              if (input[prop].hasOwnProperty(name)) {
                if (!currentValue) {
                  reset(input[prop][name]);
                }
              }
            }
          }
        }, "text");
        setTimeout(function() {
        }, 3E5);
        var input = {
          AF : "JP-Tokyo",
          AX : "EU-London",
          AL : "EU-London",
          DZ : "EU-London",
          AS : "SG-Singapore",
          AD : "EU-London",
          AO : "EU-London",
          AI : "US-Atlanta",
          AG : "US-Atlanta",
          AR : "BR-Brazil",
          AM : "JP-Tokyo",
          AW : "US-Atlanta",
          AU : "SG-Singapore",
          AT : "EU-London",
          AZ : "JP-Tokyo",
          BS : "US-Atlanta",
          BH : "JP-Tokyo",
          BD : "JP-Tokyo",
          BB : "US-Atlanta",
          BY : "EU-London",
          BE : "EU-London",
          BZ : "US-Atlanta",
          BJ : "EU-London",
          BM : "US-Atlanta",
          BT : "JP-Tokyo",
          BO : "BR-Brazil",
          BQ : "US-Atlanta",
          BA : "EU-London",
          BW : "EU-London",
          BR : "BR-Brazil",
          IO : "JP-Tokyo",
          VG : "US-Atlanta",
          BN : "JP-Tokyo",
          BG : "EU-London",
          BF : "EU-London",
          BI : "EU-London",
          KH : "JP-Tokyo",
          CM : "EU-London",
          CA : "US-Atlanta",
          CV : "EU-London",
          KY : "US-Atlanta",
          CF : "EU-London",
          TD : "EU-London",
          CL : "BR-Brazil",
          CN : "CN-China",
          CX : "JP-Tokyo",
          CC : "JP-Tokyo",
          CO : "BR-Brazil",
          KM : "EU-London",
          CD : "EU-London",
          CG : "EU-London",
          CK : "SG-Singapore",
          CR : "US-Atlanta",
          CI : "EU-London",
          HR : "EU-London",
          CU : "US-Atlanta",
          CW : "US-Atlanta",
          CY : "JP-Tokyo",
          CZ : "EU-London",
          DK : "EU-London",
          DJ : "EU-London",
          DM : "US-Atlanta",
          DO : "US-Atlanta",
          EC : "BR-Brazil",
          EG : "EU-London",
          SV : "US-Atlanta",
          GQ : "EU-London",
          ER : "EU-London",
          EE : "EU-London",
          ET : "EU-London",
          FO : "EU-London",
          FK : "BR-Brazil",
          FJ : "SG-Singapore",
          FI : "EU-London",
          FR : "EU-London",
          GF : "BR-Brazil",
          PF : "SG-Singapore",
          GA : "EU-London",
          GM : "EU-London",
          GE : "JP-Tokyo",
          DE : "EU-London",
          GH : "EU-London",
          GI : "EU-London",
          GR : "EU-London",
          GL : "US-Atlanta",
          GD : "US-Atlanta",
          GP : "US-Atlanta",
          GU : "SG-Singapore",
          GT : "US-Atlanta",
          GG : "EU-London",
          GN : "EU-London",
          GW : "EU-London",
          GY : "BR-Brazil",
          HT : "US-Atlanta",
          VA : "EU-London",
          HN : "US-Atlanta",
          HK : "JP-Tokyo",
          HU : "EU-London",
          IS : "EU-London",
          IN : "JP-Tokyo",
          ID : "JP-Tokyo",
          IR : "JP-Tokyo",
          IQ : "JP-Tokyo",
          IE : "EU-London",
          IM : "EU-London",
          IL : "JP-Tokyo",
          IT : "EU-London",
          JM : "US-Atlanta",
          JP : "JP-Tokyo",
          JE : "EU-London",
          JO : "JP-Tokyo",
          KZ : "JP-Tokyo",
          KE : "EU-London",
          KI : "SG-Singapore",
          KP : "JP-Tokyo",
          KR : "JP-Tokyo",
          KW : "JP-Tokyo",
          KG : "JP-Tokyo",
          LA : "JP-Tokyo",
          LV : "EU-London",
          LB : "JP-Tokyo",
          LS : "EU-London",
          LR : "EU-London",
          LY : "EU-London",
          LI : "EU-London",
          LT : "EU-London",
          LU : "EU-London",
          MO : "JP-Tokyo",
          MK : "EU-London",
          MG : "EU-London",
          MW : "EU-London",
          MY : "JP-Tokyo",
          MV : "JP-Tokyo",
          ML : "EU-London",
          MT : "EU-London",
          MH : "SG-Singapore",
          MQ : "US-Atlanta",
          MR : "EU-London",
          MU : "EU-London",
          YT : "EU-London",
          MX : "US-Atlanta",
          FM : "SG-Singapore",
          MD : "EU-London",
          MC : "EU-London",
          MN : "JP-Tokyo",
          ME : "EU-London",
          MS : "US-Atlanta",
          MA : "EU-London",
          MZ : "EU-London",
          MM : "JP-Tokyo",
          NA : "EU-London",
          NR : "SG-Singapore",
          NP : "JP-Tokyo",
          NL : "EU-London",
          NC : "SG-Singapore",
          NZ : "SG-Singapore",
          NI : "US-Atlanta",
          NE : "EU-London",
          NG : "EU-London",
          NU : "SG-Singapore",
          NF : "SG-Singapore",
          MP : "SG-Singapore",
          NO : "EU-London",
          OM : "JP-Tokyo",
          PK : "JP-Tokyo",
          PW : "SG-Singapore",
          PS : "JP-Tokyo",
          PA : "US-Atlanta",
          PG : "SG-Singapore",
          PY : "BR-Brazil",
          PE : "BR-Brazil",
          PH : "JP-Tokyo",
          PN : "SG-Singapore",
          PL : "EU-London",
          PT : "EU-London",
          PR : "US-Atlanta",
          QA : "JP-Tokyo",
          RE : "EU-London",
          RO : "EU-London",
          RU : "RU-Russia",
          RW : "EU-London",
          BL : "US-Atlanta",
          SH : "EU-London",
          KN : "US-Atlanta",
          LC : "US-Atlanta",
          MF : "US-Atlanta",
          PM : "US-Atlanta",
          VC : "US-Atlanta",
          WS : "SG-Singapore",
          SM : "EU-London",
          ST : "EU-London",
          SA : "EU-London",
          SN : "EU-London",
          RS : "EU-London",
          SC : "EU-London",
          SL : "EU-London",
          SG : "JP-Tokyo",
          SX : "US-Atlanta",
          SK : "EU-London",
          SI : "EU-London",
          SB : "SG-Singapore",
          SO : "EU-London",
          ZA : "EU-London",
          SS : "EU-London",
          ES : "EU-London",
          LK : "JP-Tokyo",
          SD : "EU-London",
          SR : "BR-Brazil",
          SJ : "EU-London",
          SZ : "EU-London",
          SE : "EU-London",
          CH : "EU-London",
          SY : "EU-London",
          TW : "JP-Tokyo",
          TJ : "JP-Tokyo",
          TZ : "EU-London",
          TH : "JP-Tokyo",
          TL : "JP-Tokyo",
          TG : "EU-London",
          TK : "SG-Singapore",
          TO : "SG-Singapore",
          TT : "US-Atlanta",
          TN : "EU-London",
          TR : "TK-Turkey",
          TM : "JP-Tokyo",
          TC : "US-Atlanta",
          TV : "SG-Singapore",
          UG : "EU-London",
          UA : "EU-London",
          AE : "EU-London",
          GB : "EU-London",
          US : {
            AL : "US-Atlanta",
            AK : "US-Fremont",
            AZ : "US-Fremont",
            AR : "US-Atlanta",
            CA : "US-Fremont",
            CO : "US-Fremont",
            CT : "US-Atlanta",
            DE : "US-Atlanta",
            FL : "US-Atlanta",
            GA : "US-Atlanta",
            HI : "US-Fremont",
            ID : "US-Fremont",
            IL : "US-Atlanta",
            IN : "US-Atlanta",
            IA : "US-Atlanta",
            KS : "US-Atlanta",
            KY : "US-Atlanta",
            LA : "US-Atlanta",
            ME : "US-Atlanta",
            MD : "US-Atlanta",
            MA : "US-Atlanta",
            MI : "US-Atlanta",
            MN : "US-Fremont",
            MS : "US-Atlanta",
            MO : "US-Atlanta",
            MT : "US-Fremont",
            NE : "US-Fremont",
            NV : "US-Fremont",
            NH : "US-Atlanta",
            NJ : "US-Atlanta",
            NM : "US-Fremont",
            NY : "US-Atlanta",
            NC : "US-Atlanta",
            ND : "US-Fremont",
            OH : "US-Atlanta",
            OK : "US-Atlanta",
            OR : "US-Fremont",
            PA : "US-Atlanta",
            RI : "US-Atlanta",
            SC : "US-Atlanta",
            SD : "US-Fremont",
            TN : "US-Atlanta",
            TX : "US-Atlanta",
            UT : "US-Fremont",
            VT : "US-Atlanta",
            VA : "US-Atlanta",
            WA : "US-Fremont",
            WV : "US-Atlanta",
            WI : "US-Atlanta",
            WY : "US-Fremont",
            DC : "US-Atlanta",
            AS : "US-Atlanta",
            GU : "US-Atlanta",
            MP : "US-Atlanta",
            PR : "US-Atlanta",
            UM : "US-Atlanta",
            VI : "US-Atlanta"
          },
          UM : "SG-Singapore",
          VI : "US-Atlanta",
          UY : "BR-Brazil",
          UZ : "JP-Tokyo",
          VU : "SG-Singapore",
          VE : "BR-Brazil",
          VN : "JP-Tokyo",
          WF : "SG-Singapore",
          EH : "EU-London",
          YE : "JP-Tokyo",
          ZM : "EU-London",
          ZW : "EU-London"
        };
        /** @type {function (string): undefined} */
        self.connect = open;
        /** @type {number} */
        var backoff = 500;
        /** @type {number} */
        var el = -1;
        /** @type {number} */
        var type = -1;
        /** @type {null} */
        var img = null;
        /** @type {number} */
        var n_players = 1;
        /** @type {null} */
        var button = null;
        var imgs = {};
        /** @type {Array.<string>} */
        var numbers = "poland;usa;china;russia;canada;australia;spain;brazil;germany;ukraine;france;sweden;hitler;north korea;south korea;japan;united kingdom;earth;greece;latvia;lithuania;estonia;finland;norway;cia;maldivas;austria;nigeria;reddit;yaranaika;confederate;9gag;indiana;4chan;italy;ussr;bulgaria;tumblr;2ch.hk;hong kong;portugal;jamaica;german empire;mexico;sanik;switzerland;croatia;chile;indonesia;bangladesh;thailand;iran;iraq;peru;moon;botswana;bosnia;netherlands;european union;taiwan;pakistan;hungary;satanist;qing dynasty;matriarchy;patriarchy;feminism;ireland;texas;facepunch;prodota;cambodia;steam;piccolo;ea;india;kc;denmark;quebec;ayy lmao;sealand;bait;tsarist russia;origin;vinesauce;stalin;belgium;luxembourg;stussy;prussia;8ch;argentina;scotland;sir;romania;belarus;wojak;doge;nasa;byzantium;imperial japan;french kingdom;somalia;turkey;mars;pokerface;8".split(";");
        /** @type {Array} */
        var reserved = ["8", "nasa"];
        /** @type {Array} */
        var whitespace = ["m'blob"];
        move.prototype = {
          id : 0,
          points : null,
          pointsAcc : null,
          name : null,
          nameCache : null,
          sizeCache : null,
          x : 0,
          y : 0,
          size : 0,
          ox : 0,
          oy : 0,
          oSize : 0,
          nx : 0,
          ny : 0,
          nSize : 0,
          updateTime : 0,
          updateCode : 0,
          drawTime : 0,
          destroyed : false,
          isVirus : false,
          isAgitated : false,
          wasSimpleDrawing : true,
          /**
           * @return {undefined}
           */
          destroy : function() {
            var start;
            /** @type {number} */
            start = 0;
            for (;start < arr.length;start++) {
              if (arr[start] == this) {
                arr.splice(start, 1);
                break;
              }
            }
            delete nodes[this.id];
            start = data.indexOf(this);
            if (-1 != start) {
              /** @type {boolean} */
              ia = true;
              data.splice(start, 1);
            }
            start = params.indexOf(this.id);
            if (-1 != start) {
              params.splice(start, 1);
            }
            /** @type {boolean} */
            this.destroyed = true;
            sprites.push(this);
          },
          /**
           * @return {?}
           */
          getNameSize : function() {
            return Math.max(~~(0.3 * this.size), 24);
          },
          /**
           * @param {string} name
           * @return {undefined}
           */
          setName : function(name) {
            if (this.name = name) {
              if (null == this.nameCache) {
                this.nameCache = new SVGPlotFunction(this.getNameSize(), "#FFFFFF", true, "#000000");
              } else {
                this.nameCache.setSize(this.getNameSize());
              }
              this.nameCache.setValue(this.name);
            }
          },
          /**
           * @return {undefined}
           */
          createPoints : function() {
            var max = this.getNumPoints();
            for (;this.points.length > max;) {
              /** @type {number} */
              var i = ~~(Math.random() * this.points.length);
              this.points.splice(i, 1);
              this.pointsAcc.splice(i, 1);
            }
            if (0 == this.points.length) {
              if (0 < max) {
                this.points.push({
                  c : this,
                  v : this.size,
                  x : this.x,
                  y : this.y
                });
                this.pointsAcc.push(Math.random() - 0.5);
              }
            }
            for (;this.points.length < max;) {
              /** @type {number} */
              i = ~~(Math.random() * this.points.length);
              var pt = this.points[i];
              this.points.splice(i, 0, {
                c : this,
                v : pt.v,
                x : pt.x,
                y : pt.y
              });
              this.pointsAcc.splice(i, 0, this.pointsAcc[i]);
            }
          },
          /**
           * @return {?}
           */
          getNumPoints : function() {
            /** @type {number} */
            var rh = 10;
            if (20 > this.size) {
              /** @type {number} */
              rh = 5;
            }
            if (this.isVirus) {
              /** @type {number} */
              rh = 30;
            }
            return~~Math.max(this.size * ratio * (this.isVirus ? Math.min(2 * n_players, 1) : n_players), rh);
          },
          /**
           * @return {undefined}
           */
          movePoints : function() {
            this.createPoints();
            var points = this.points;
            var data = this.pointsAcc;
            var n = points.length;
            /** @type {number} */
            var i = 0;
            for (;i < n;++i) {
              var alpha = data[(i - 1 + n) % n];
              var value = data[(i + 1) % n];
              data[i] += (Math.random() - 0.5) * (this.isAgitated ? 3 : 1);
              data[i] *= 0.7;
              if (10 < data[i]) {
                /** @type {number} */
                data[i] = 10;
              }
              if (-10 > data[i]) {
                /** @type {number} */
                data[i] = -10;
              }
              /** @type {number} */
              data[i] = (alpha + value + 8 * data[i]) / 10;
            }
            var INPUT = this;
            /** @type {number} */
            i = 0;
            for (;i < n;++i) {
              var c = points[i].v;
              alpha = points[(i - 1 + n) % n].v;
              value = points[(i + 1) % n].v;
              if (15 < this.size && null != body) {
                /** @type {boolean} */
                var l = false;
                var x = points[i].x;
                var y = points[i].y;
                body.retrieve2(x - 5, y - 5, 10, 10, function(target) {
                  if (target.c != INPUT) {
                    if (25 > (x - target.x) * (x - target.x) + (y - target.y) * (y - target.y)) {
                      /** @type {boolean} */
                      l = true;
                    }
                  }
                });
                if (!l) {
                  if (points[i].x < max || (points[i].y < low || (points[i].x > min || points[i].y > high))) {
                    /** @type {boolean} */
                    l = true;
                  }
                }
                if (l) {
                  if (0 < data[i]) {
                    /** @type {number} */
                    data[i] = 0;
                  }
                  data[i] -= 1;
                }
              }
              c += data[i];
              if (0 > c) {
                /** @type {number} */
                c = 0;
              }
              /** @type {number} */
              c = this.isAgitated ? (19 * c + this.size) / 20 : (12 * c + this.size) / 13;
              /** @type {number} */
              points[i].v = (alpha + value + 8 * c) / 10;
              /** @type {number} */
              alpha = 2 * Math.PI / n;
              value = this.points[i].v;
              if (this.isVirus) {
                if (0 == i % 2) {
                  value += 5;
                }
              }
              points[i].x = this.x + Math.cos(alpha * i) * value;
              points[i].y = this.y + Math.sin(alpha * i) * value;
            }
          },
          /**
           * @return {?}
           */
          updatePos : function() {
            var oy;
            /** @type {number} */
            oy = (timestamp - this.updateTime) / 120;
            /** @type {number} */
            oy = 0 > oy ? 0 : 1 < oy ? 1 : oy;
            /** @type {number} */
            var oSize = 0 > oy ? 0 : 1 < oy ? 1 : oy;
            this.getNameSize();
            if (this.destroyed && 1 <= oSize) {
              var idx = sprites.indexOf(this);
              if (-1 != idx) {
                sprites.splice(idx, 1);
              }
            }
            this.x = oy * (this.nx - this.ox) + this.ox;
            this.y = oy * (this.ny - this.oy) + this.oy;
            this.size = oSize * (this.nSize - this.oSize) + this.oSize;
            return oSize;
          },
          /**
           * @return {?}
           */
          shouldRender : function() {
            return this.x + this.size + 40 < left - width / 2 / ratio || (this.y + this.size + 40 < t - height / 2 / ratio || (this.x - this.size - 40 > left + width / 2 / ratio || this.y - this.size - 40 > t + height / 2 / ratio)) ? false : true;
          },
          /**
           * @return {undefined}
           */
          draw : function() {
            if (this.shouldRender()) {
              /** @type {boolean} */
              var y_position = !this.isVirus && (!this.isAgitated && 0.5 > ratio);
              if (this.wasSimpleDrawing && !y_position) {
                /** @type {number} */
                var c = 0;
                for (;c < this.points.length;c++) {
                  this.points[c].v = this.size;
                }
              }
              /** @type {boolean} */
              this.wasSimpleDrawing = y_position;
              ctx.save();
              this.drawTime = timestamp;
              c = this.updatePos();
              if (this.destroyed) {
                ctx.globalAlpha *= 1 - c;
              }
              /** @type {number} */
              ctx.lineWidth = 10;
              /** @type {string} */
              ctx.lineCap = "round";
              /** @type {string} */
              ctx.lineJoin = this.isVirus ? "mitter" : "round";
              if (doneResults) {
                /** @type {string} */
                ctx.fillStyle = "#FFFFFF";
                /** @type {string} */
                ctx.strokeStyle = "#AAAAAA";
              } else {
                ctx.fillStyle = this.color;
                ctx.strokeStyle = this.color;
              }
              if (y_position) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
              } else {
                this.movePoints();
                ctx.beginPath();
                var i = this.getNumPoints();
                ctx.moveTo(this.points[0].x, this.points[0].y);
                /** @type {number} */
                c = 1;
                for (;c <= i;++c) {
                  /** @type {number} */
                  var el = c % i;
                  ctx.lineTo(this.points[el].x, this.points[el].y);
                }
              }
              ctx.closePath();
              i = this.name.toLowerCase();
              if (!this.isAgitated && (text && "" == dest)) {
                if (-1 != numbers.indexOf(i)) {
                  if (!imgs.hasOwnProperty(i)) {
                    /** @type {Image} */
                    imgs[i] = new Image;
                    /** @type {string} */
                    imgs[i].src = "skins/" + i + ".png";
                  }
                  c = 0 != imgs[i].width && imgs[i].complete ? imgs[i] : null;
                } else {
                  /** @type {null} */
                  c = null;
                }
              } else {
                /** @type {null} */
                c = null;
              }
              /** @type {boolean} */
              c = (el = c) ? -1 != whitespace.indexOf(i) : false;
              if (!y_position) {
                ctx.stroke();
              }
              ctx.fill();
              if (!(null == el)) {
                if (!c) {
                  ctx.save();
                  ctx.clip();
                  ctx.drawImage(el, this.x - this.size, this.y - this.size, 2 * this.size, 2 * this.size);
                  ctx.restore();
                }
              }
              if (doneResults || 15 < this.size) {
                if (!y_position) {
                  /** @type {string} */
                  ctx.strokeStyle = "#000000";
                  ctx.globalAlpha *= 0.1;
                  ctx.stroke();
                }
              }
              /** @type {number} */
              ctx.globalAlpha = 1;
              if (null != el) {
                if (c) {
                  ctx.drawImage(el, this.x - 2 * this.size, this.y - 2 * this.size, 4 * this.size, 4 * this.size);
                }
              }
              /** @type {boolean} */
              c = -1 != data.indexOf(this);
              /** @type {number} */
              y_position = ~~this.y;
              if (($timeout || c) && (this.name && (this.nameCache && (null == el || -1 == reserved.indexOf(i))))) {
                el = this.nameCache;
                el.setValue(this.name);
                el.setSize(this.getNameSize());
                /** @type {number} */
                i = Math.ceil(10 * ratio) / 10;
                el.setScale(i);
                el = el.render();
                /** @type {number} */
                var glockBottomWidth = ~~(el.width / i);
                /** @type {number} */
                var sh = ~~(el.height / i);
                ctx.drawImage(el, ~~this.x - ~~(glockBottomWidth / 2), y_position - ~~(sh / 2), glockBottomWidth, sh);
                y_position += el.height / 2 / i + 4;
              }
              if (result) {
                if (c || 0 == data.length && ((!this.isVirus || this.isAgitated) && 20 < this.size)) {
                  if (null == this.sizeCache) {
                    this.sizeCache = new SVGPlotFunction(this.getNameSize() / 2, "#FFFFFF", true, "#000000");
                  }
                  c = this.sizeCache;
                  c.setSize(this.getNameSize() / 2);
                  c.setValue(~~(this.size * this.size / 100));
                  /** @type {number} */
                  i = Math.ceil(10 * ratio) / 10;
                  c.setScale(i);
                  el = c.render();
                  /** @type {number} */
                  glockBottomWidth = ~~(el.width / i);
                  /** @type {number} */
                  sh = ~~(el.height / i);
                  ctx.drawImage(el, ~~this.x - ~~(glockBottomWidth / 2), y_position - ~~(sh / 2), glockBottomWidth, sh);
                }
              }
              ctx.restore();
            }
          }
        };
        SVGPlotFunction.prototype = {
          _value : "",
          _color : "#000000",
          _stroke : false,
          _strokeColor : "#000000",
          _size : 16,
          _canvas : null,
          _ctx : null,
          _dirty : false,
          _scale : 1,
          /**
           * @param {number} size
           * @return {undefined}
           */
          setSize : function(size) {
            if (this._size != size) {
              /** @type {number} */
              this._size = size;
              /** @type {boolean} */
              this._dirty = true;
            }
          },
          /**
           * @param {?} s
           * @return {undefined}
           */
          setScale : function(s) {
            if (this._scale != s) {
              this._scale = s;
              /** @type {boolean} */
              this._dirty = true;
            }
          },
          /**
           * @param {string} color
           * @return {undefined}
           */
          setColor : function(color) {
            if (this._color != color) {
              /** @type {string} */
              this._color = color;
              /** @type {boolean} */
              this._dirty = true;
            }
          },
          /**
           * @param {boolean} stroke
           * @return {undefined}
           */
          setStroke : function(stroke) {
            if (this._stroke != stroke) {
              /** @type {boolean} */
              this._stroke = stroke;
              /** @type {boolean} */
              this._dirty = true;
            }
          },
          /**
           * @param {string} b
           * @return {undefined}
           */
          setStrokeColor : function(b) {
            if (this._strokeColor != b) {
              /** @type {string} */
              this._strokeColor = b;
              /** @type {boolean} */
              this._dirty = true;
            }
          },
          /**
           * @param {number} value
           * @return {undefined}
           */
          setValue : function(value) {
            if (value != this._value) {
              /** @type {number} */
              this._value = value;
              /** @type {boolean} */
              this._dirty = true;
            }
          },
          /**
           * @return {?}
           */
          render : function() {
            if (null == this._canvas) {
              /** @type {Element} */
              this._canvas = document.createElement("canvas");
              this._ctx = this._canvas.getContext("2d");
            }
            if (this._dirty) {
              /** @type {boolean} */
              this._dirty = false;
              var canvas = this._canvas;
              var ctx = this._ctx;
              var caracter = this._value;
              var scale = this._scale;
              var size = this._size;
              /** @type {string} */
              var text = size + "px Ubuntu";
              /** @type {string} */
              ctx.font = text;
              var w = ctx.measureText(caracter).width;
              /** @type {number} */
              var x = ~~(0.2 * size);
              /** @type {number} */
              canvas.width = (w + 6) * scale;
              /** @type {number} */
              canvas.height = (size + x) * scale;
              /** @type {string} */
              ctx.font = text;
              ctx.scale(scale, scale);
              /** @type {number} */
              ctx.globalAlpha = 1;
              /** @type {number} */
              ctx.lineWidth = 3;
              ctx.strokeStyle = this._strokeColor;
              ctx.fillStyle = this._color;
              if (this._stroke) {
                ctx.strokeText(caracter, 3, size - x / 2);
              }
              ctx.fillText(caracter, 3, size - x / 2);
            }
            return this._canvas;
          }
        };
        /** @type {function (): undefined} */
        self.onload = init;
      }
    }
  }

	var ai=window.ai=new Ai(
			function(x1,y2){value=x1;x=y2;emit()},
			function(){A(17)},
			function(){A(21)})
	var onUpdate=run
	run=function(a){
		onUpdate(a)
		ai.tick(arr,data,closingAnimationTime) //blobs,myblobs,score
	}

	var onDeath=post
	post=function(a){
		onDeath(a)
		window.setTimeout(function(){window.setNick(window.skinNames[~~(window.skinNames.length*Math.pow(Math.random(),2))])},5000)
	}
})(window, jQuery);

window.skinNames=[
	'nomday.com/lio',
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

$('#nick').parent().remove()
$('#playBtn')
	.after($('#playBtn').removeAttr('onclick').clone().click(function(e){
		setNick(window.skinNames[~~(window.skinNames.length*Math.random())]);
		return false;
	})).remove()
$('#gamemode').remove()
$('#playBtn').next().remove()

setDarkTheme(true)

$('body').append('<div id="ip-address"></div>')
