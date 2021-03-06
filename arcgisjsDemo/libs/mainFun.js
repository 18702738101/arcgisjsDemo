//绘图
var draw;
//当前视图
var view;
//当前地图
var map;

let editGraphic;

var featurelayer = null;

var editGraphicSymbols = [];

var initextent=null;

//动态裁图图层（底图）
var maplayer;
//"http://192.168.56.102:6080/arcgis/rest/services/DLTB/MapServer"; //
//已发布地图文档的rest地址
var MapURL = "http://192.168.56.102:6080/arcgis/rest/services/DLTB/MapServer"; //"http://192.168.56.102:6080/arcgis/rest/services/DLTB/MapServer"; //"http://192.168.56.102:6080/arcgis/rest/services/DLTBFeatureLayer/MapServer"
var featureURL =
  "	http://192.168.56.102:6080/arcgis/rest/services/zj/FeatureServer";
//"http://192.168.56.102:6080/arcgis/rest/services/DLTB/FeatureServer";
//默认点图形参数
var pointsymbol = {
  type: "simple-marker",
  color: "rgba(255,0,0,0.8)",
  size: 6,
  outline: {
    width: 1,
    color: "#f0d524"
  }
};
//默认线图形参数
var linesymbol = {
  type: "simple-line", // autocasts as new SimpleLineSymbol()
  color: "rgb(255,215,0)",
  width: "2",
  style: "solid"
};
var fillsymbol = {
  type: "simple-fill", // autocasts as new SimpleFillSymbol()
  color: "rgba(128,128,128,0.6)",
  style: "solid",
  outline: {
    color: "rgba(255,0,0,0.8)",
    width: 1
  }
};

var attmodify = false;
//dojo语法，调用require动态加载所需功能模块（js）
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/layers/MapImageLayer",
  "esri/layers/TileLayer",
  "esri/layers/FeatureLayer",
  "esri/geometry/Extent",
  "esri/widgets/ScaleBar",
  "esri/views/2d/draw/Draw",
  "esri/widgets/Sketch/SketchViewModel",
  // "esri/views/2d/draw/PointDrawAction",
  // "esri/views/2d/draw/SegmentDrawAction",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/geometry/Polygon",
  "esri/geometry/Point",
  "esri/Viewpoint",
  "esri/tasks/QueryTask",
  "esri/tasks/support/Query",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "esri/widgets/Popup",
  "esri/geometry/SpatialReference",
  "esri/geometry/projection",
  "esri/tasks/support/ProjectParameters",
  // "dijit/TitlePane",
  // "dijit/ColorPalette",
  "dojo/domReady!" //表示准备完毕，放在最后
], function(
  Map, //Esri地图对象
  MapView, //Esri二维视图对象
  SceneView,
  MapImageLayer, //Esri动态裁图图层对象
  TileLayer,
  FeatureLayer, //Esri要素图层对象
  Extent, //Esri矩形几何对象
  ScaleBar, //Esri比例尺对象
  Draw, //Esri绘图工具
  SketchViewModel,
  // PointDrawAction,
  // SegmentDrawAction,
  Graphic, //Esri图形对象，它可以包含几何，符号和属性对象
  GraphicsLayer, //Esri图形图层对象，可以包含多个graphic图形对象
  Polygon, //Esri多边形对象
  Point,
  Viewpoint,
  QueryTask, //Esri查询对象（之一）
  Query, //Esri查询参数
  SimpleMarkerSymbol,
  SimpleLineSymbol, //Esri线符号
  SimpleFillSymbol, //Esri填充符号
  Color, //Esri颜色对象
  Popup,
  SpatialReference,
  projection,
  ProjectParameters
  // TitlePane,
  // ColorPalette
) {
  const tempGraphicsLayer = new GraphicsLayer();
  //初始化动态裁图图层
  maplayer = new MapImageLayer({
    url: MapURL
  });

  //初始化地图对象
  map = new Map();
  //初始化二维视图
  view = new MapView({
    container: "mapCon", // 地图容器所在DOM元素的ID
    map: map, // 指向新地图
    center: [120.15816, 30.26778], //[111, 30],
    zoom: 3
  });

  // view = new SceneView({
  //   container: "mapCon",
  //   map: map,
  //   Camera: { // autocasts as new Camera()
  //     position: [ 112, 30, 1000 ],  // creates a point instance (x,y,z)
  //     // position: { // autocasts as new Point()
  //     //   x: 112,
  //     //   y: 30,
  //     //   z: 500
  //     // },
  //     heading: 90,
  //     tilt: 40
  //   }
  // });

  map.layers.add(maplayer); // 添加图层
  map.layers.add(tempGraphicsLayer);
  //初始化比例尺对象
  var scaleBar = new ScaleBar({
    view: view,
    unit: "dual"
  });
  //添加比例尺
  view.ui.add(scaleBar, {
    position: "bottom-left"
  });

  //*************************************************************
  // 视图加载完成监听
  //*************************************************************
  view.when(function() {
    initextent=view.extent;
    //初始化草图绘制工具
    var sketchViewModel = new SketchViewModel({
      view: view,
      layer: tempGraphicsLayer,
      pointSymbol: pointsymbol,
      polylineSymbol: linesymbol,
      polygonSymbol: fillsymbol
    });
    setUpClickHandler();

    // 监听绘制完成事件以将新绘制的图形加到临时图层中
    sketchViewModel.on("create-complete", addGraphic);

    // 监听绘制过程中的更新完成和取消事件
    sketchViewModel.on("update-complete", updateGraphic);
    sketchViewModel.on("update-cancel", updateGraphic);

    //*************************************************************
    // 绘制完成的回调函数
    //*************************************************************
    function addGraphic(event) {
      // 根据几何信息和图形符号信息创建图形
      const graphic = new Graphic({
        geometry: event.geometry,
        symbol: sketchViewModel.graphic.symbol
      });
      if (event.tool != "rectangle") {
        //绘制要素
        tempGraphicsLayer.add(graphic);
        if (featurelayer != null) {
          featureadd = graphic;
          //根据几何位置并查询相关图层属性字段信息创建Popup弹窗
          creatPopupbyqueryFields(event.geometry);
        }
      } else {
        //矩形查询
        queryGraphic(event.geometry);
      }
    }
    //*************************************************************
    // 创建要素图形符号列表面板
    //*************************************************************
    function creatsymbolPanel(featurelayer) {
      //查询全部要素
      featurelayer.queryFeatures().then(function(result) {
        var featursource = featurelayer.source;
        //保存所有要素的单值图形信息的数组
        editGraphicSymbols = [];
        //获取所有要素的渲染的单值图形信息
        var uniqueValueInfos = featursource.layer.renderer.uniqueValueInfos;
        var content = "";
        //单值符号系统
        if (uniqueValueInfos != undefined || uniqueValueInfos != null) {
          var tds = "";
          for (var i = 0; i < uniqueValueInfos.length; i++) {
            var symbol = uniqueValueInfos[i].symbol;
            editGraphicSymbols.push(symbol);
            var symboltype = symbol.type;
            var svg = "";
            //简单线类型
            if (symboltype == "simple-line") {
              var linestyle = symbol.style;
              var linewidth = symbol.width;
              var linecap = symbol.cap;
              var linejoin = symbol.join;
              var linemiterLimit = symbol.miterLimit;
              var linecolor =
                "rgba(" +
                symbol.color.r +
                "," +
                symbol.color.g +
                "," +
                symbol.color.b +
                "," +
                symbol.color.a +
                ")";
              svg =
                "<td><div><a href='#'><svg overflow='hidden' width='30' height='30' style='touch-action: none;'><defs></defs>" +
                "<path fill='none' fill-opacity='0' stroke='" +
                linecolor +
                "'" +
                " stroke-opacity='1' stroke-width='" +
                linewidth +
                "' stroke-linecap='" +
                linecap +
                "' stroke-linejoin='" +
                linejoin +
                "' stroke-miterlimit='" +
                linemiterLimit +
                "'" +
                " path='M -15,0 L 15,0 E' d='M-15 0L 15 0' stroke-dasharray='none' dojoGfxStrokeStyle='" +
                linestyle +
                "'" +
                " transform='matrix(1.00000000,0.00000000,0.00000000,1.00000000,15.00000000,15.00000000)'></path></svg>";
            }
            //简单区类型
            else if (symboltype == "simple-fill") {
              switch (symbol.style) {
                case "backward-diagonal":
                  svg =
                    "<td><div><a href='#'><svg overflow='hidden' width='30' height='30' style='touch-action: none;'>" +
                    "<defs><pattern id='dojoxUnique5' patternUnits='userSpaceOnUse' x='0.00000000' y='0.00000000' width='10.00000000' height='10.00000000'>" +
                    "<image x='0' y='0' width='10.00000000' height='10.00000000' xlink:href='//cdn-a.arcgis.com/cdn/1859746/js/jsapi/esri/images/symbol/sfs/backwarddiagonal.png'></image>" +
                    "</pattern></defs>" +
                    "<path fill='url(#dojoxUnique5)' stroke='rgb(64, 101, 235)' stroke-opacity='1' stroke-width='0.5333333333333333' stroke-linecap='butt' stroke-linejoin='miter' stroke-miterlimit='4'" +
                    " path='M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 Z' d='M-10-10L 10 0L 10 10L-10 10L-10-10Z' fill-rule='evenodd' stroke-dasharray='none' dojoGfxStrokeStyle='solid'" +
                    " transform='matrix(1.00000000,0.00000000,0.00000000,1.00000000,15.00000000,15.00000000)'></path></svg>";
                  break;
                case "solid":
                  var symboloutline = symbol.outline;
                  var outlinecolor =
                    "rgba(" +
                    symboloutline.color.r +
                    "," +
                    symboloutline.color.g +
                    "," +
                    symboloutline.color.b +
                    "," +
                    symboloutline.color.a +
                    ")";
                  var outlinewidth = symboloutline.width;
                  var outlinestyle = symboloutline.style;
                  var outlinetype = symboloutline.type; //"simple-line"
                  var outlinecap = symboloutline.cap;
                  var outlinejoin = symboloutline.join;
                  var outlinemiterLimit = symboloutline.miterLimit;
                  var fillcolor =
                    "rgba(" +
                    symbol.color.r +
                    "," +
                    symbol.color.g +
                    "," +
                    symbol.color.b +
                    "," +
                    symbol.color.a +
                    ")";
                  svg =
                    "<td><div><a href='#'><svg overflow='hidden' width='30' height='30' style='touch-action: none;'>" +
                    "<defs></defs>" +
                    "<path fill='" +
                    fillcolor +
                    "' fill-opacity='1' stroke='" +
                    outlinestyle +
                    "' stroke-opacity='0'" +
                    " stroke-width='" +
                    outlinewidth +
                    "' stroke-linecap='" +
                    outlinecap +
                    "' stroke-linejoin='" +
                    outlinejoin +
                    "'" +
                    " stroke-miterlimit='" +
                    outlinemiterLimit +
                    "' path='M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 Z'" +
                    " d='M-10-10L 10 0L 10 10L-10 10L-10-10Z' fill-rule='evenodd'" +
                    " transform='matrix(1.00000000,0.00000000,0.00000000,1.00000000,15.00000000,15.00000000)'></path></svg>";

                  break;
                default:
                  svg = "<td><div><a href='#'>暂不支持其它样式选择";
                  break;
              }
            }
            //图片填充区
            else if (symboltype == "picture-fill") {
              var id = symbol.id;
              var imgurl = symbol.url;
              var width = symbol.width;
              var height = symbol.height;
              var symboloutline = symbol.outline;
              var outlinecolor =
                "rgba(" +
                symboloutline.color.r +
                "," +
                symboloutline.color.g +
                "," +
                symboloutline.color.b +
                "," +
                symboloutline.color.a +
                ")";
              var outlinewidth = symboloutline.width;
              var outlinestyle = symboloutline.style;
              var outlinetype = symboloutline.type; //"simple-line"
              var outlinecap = symboloutline.cap;
              var outlinejoin = symboloutline.join;
              var outlinemiterLimit = symboloutline.miterLimit;
              var fillcolor =
                "rgba(" +
                symbol.color.r +
                "," +
                symbol.color.g +
                "," +
                symbol.color.b +
                "," +
                symbol.color.a +
                ")";
              svg =
                "<td><div><a href='#'><svg overflow='hidden' width='30' height='30'" +
                " style='touch-action: none;'><defs><pattern id='" +
                id +
                "'" +
                " patternUnits='userSpaceOnUse' x='0.00000000' y='0.00000000'" +
                " width='" +
                width +
                "' height='" +
                height +
                "'><image x='0' y='0'" +
                " width='" +
                width +
                "' height='" +
                height +
                "'" +
                " xlink:href='" +
                imgurl +
                "'></image></pattern></defs>" +
                "<path fill='url(#" +
                id +
                ")' stroke='" +
                fillcolor +
                "' stroke-opacity='1'" +
                " stroke-width='" +
                outlinewidth +
                "' stroke-linecap='" +
                outlinecap +
                "'" +
                " stroke-linejoin='" +
                outlinejoin +
                "' stroke-miterlimit='" +
                outlinemiterLimit +
                "'" +
                " path='M -10,-10 L 10,0 L 10,10 L -10,10 L -10,-10 Z' d='M-10-10L 10 0L 10 10L-10 10L-10-10Z'" +
                " fill-rule='evenodd' stroke-dasharray='none' dojoGfxStrokeStyle='" +
                outlinestyle +
                "'" +
                " transform='matrix(1.00000000,0.00000000,0.00000000,1.00000000,15.00000000,15.00000000)'></path></svg>";
            }
            //图片标注
            else if (symboltype == "picture-marker") {
              var imgurl = symbol.url;
              var width = symbol.width;
              var height = symbol.height;
              svg =
                "<td><div><a href='#'><svg overflow='hidden' width='30' height='30' style='touch-action: none;'>" +
                "<defs></defs>" +
                "<image fill-opacity='0' width='" +
                width +
                "' height='" +
                height +
                "' stroke='none' stroke-opacity='0'" +
                " stroke-width='1' stroke-linecap='butt' stroke-linejoin='miter'" +
                " stroke-miterlimit='4' x='-6' y='-6'" +
                " preserveAspectRatio='none'" +
                " xlink:href='" +
                imgurl +
                "'" +
                " transform='matrix(1.00000000,0.00000000,0.00000000,1.00000000,15.33333333,15.33333333)'></image></svg>";
            }
            //每三个换一行
            if ((i + 1) % 3 == 0) {
              tds =
                "<tr>" +
                tds +
                svg +
                "<span>" +
                uniqueValueInfos[i].label +
                "</span></a></td></div></tr>";
              content = content + tds;
              tds = "";
            } else {
              tds =
                tds +
                svg +
                "<span>" +
                uniqueValueInfos[i].label +
                "</span></a></div></td>";
            }
          }
          if (tds != "") {
            content = content + "<tr>" + tds + "</tr>";
          }
        }
        //统一符号系统
        else {
          editGraphicSymbols.push(featursource.layer.renderer.symbol);
          //图片标注
          if (featursource.layer.renderer.symbol.type == "picture-marker") {
            var imgurl = featursource.layer.renderer.symbol.url;
            var width = featursource.layer.renderer.symbol.width;
            var height = featursource.layer.renderer.symbol.height;
            content =
              "<tr><td><div><a href='#'><svg overflow='hidden' width='30' height='30' style='touch-action: none;'>" +
              "<defs></defs>" +
              "<image fill-opacity='0' width='" +
              width +
              "' height='" +
              height +
              "' stroke='none' stroke-opacity='0'" +
              " stroke-width='1' stroke-linecap='butt' stroke-linejoin='miter'" +
              " stroke-miterlimit='4' x='-6' y='-6'" +
              " preserveAspectRatio='none'" +
              " xlink:href='" +
              imgurl +
              "'" +
              " transform='matrix(1.00000000,0.00000000,0.00000000,1.00000000,15.33333333,15.33333333)'></image></svg>" +
              "<span>统一符号<span></a></div></td></tr>";
          }
          //其它标注
          else {
          }
        }

        var symboltable =
          "<table border='0' class='symboltable'>" + content + "</table>";
        var content =
          "<div><a href='#' title='折叠'>▲</a>" +
          featurelayer.title +
          "<a href='#'>✘</a></div><div>" +
          symboltable +
          "</div>";
        $(".symbolpanel")[0].innerHTML = content;
        $(".symbolpanel").show(500);
      });
    }

    //***************************************************************
    // 草图绘制工具图形信息更新的回调
    //*************************************************************
    function updateGraphic(event) {
      // event.graphic is the graphic that user clicked on and its geometry
      // has not been changed. Update its geometry and add it to the layer
      event.graphic.geometry = event.geometry;
      tempGraphicsLayer.add(event.graphic);

      // set the editGraphic to null update is complete or cancelled.
      editGraphic = null;
    }

    // ************************************************************************************
    // 设置处理几何更新并反射到“tempGraphicsLayer”上的更新的逻辑函数
    // ************************************************************************************
    function setUpClickHandler() {
      view.on("click", function(event) {
        view.hitTest(event).then(function(response) {
          var results = response.results;
          //找到有效的图形
          if (results.length && results[results.length - 1].graphic) {
            //检查我们是否已经编辑了图形
            if (!editGraphic) {
              //保存对我们打算更新的图形的引用
              editGraphic = results[results.length - 1].graphic;
              //从GraphicsLayer中删除图形
              //草图将处理在更新时显示图形
              tempGraphicsLayer.remove(editGraphic);
              sketchViewModel.update(editGraphic);
            }
          }
        });
      });
    }

    // ************************************************************************************
    // 处理jquery的事件监听
    // ************************************************************************************
    $(function() {
      // ************************************************************************************
      // 工具栏单击事件
      // ************************************************************************************
      $(".toolbar")
        .find("img")
        .bind("click", function() {
          attmodify = false;
          if ($(this).context.title == "单击查询") {
            if (draw != null) {
              //按钮设为激活
              setActiveButton($(this));
              //清除要素闪烁效果
              if (graphicslayer != null && iCount != null) {
                //清除计时器
                clearInterval(iCount);
                graphicslayer.removeAll();
                graphicslayer.refresh();
                graphicslayer = null;
              }
              //打开图层选择列表
              if ($(".layercotain")[0].innerHTML == "") {
                getfeaturelayer();
              } else {
                $(".layercotain").show(300);
              }
              //重置草图绘制工具
              sketchViewModel.reset();
              //创建绘制点画笔工具
              var action = draw.create("point", { mode: "click" });
              //监听光标移动
              action.on("cursor-update", function(evt) {
                createPointGraphic(evt.coordinates);
              });

              //监听绘制完成事件
              action.on("draw-complete", function(evt) {
                //根据点击位置创建点
                createPointGraphic(evt.coordinates);
                var point = {
                  type: "point", // autocasts as /Point
                  x: evt.coordinates[0],
                  y: evt.coordinates[1],
                  spatialReference: view.spatialReference
                };
                //根据点位置查询要素信息
                queryGraphic(point);
              });
            }
          } else if ($(this).context.title == "拉框查询") {
            if (draw != null) {
              setActiveButton($(this));
              if (graphicslayer != null && iCount != null) {
                clearInterval(iCount);
                graphicslayer.removeAll();
                graphicslayer.refresh();
                graphicslayer = null;
              }
              if ($(".layercotain")[0].innerHTML == "") {
                getfeaturelayer();
              } else {
                $(".layercotain").show(300);
              }
              //移除视图中所有临时绘制的图形
              view.graphics.removeAll();
              sketchViewModel.polygonSymbol=fillsymbol;
              //利用草图工具创建矩形（拉框查询）
              sketchViewModel.create("rectangle");
            }
          } else if ($(this).context.title == "添加要素") {
            if (draw != null) {
              setActiveButton($(this));
              if (graphicslayer != null && iCount != null) {
                clearInterval(iCount);
                graphicslayer.removeAll();
                graphicslayer.refresh();
                graphicslayer = null;
              }
              if ($(".layercotain")[0].innerHTML == "") {
                getfeaturelayer();
              } else {
                $(".layercotain").show(300);
              }
              if (featurelayer == null) {
                var queryURL = $(
                  ".layercotain ul li input[type='radio']:checked"
                ).val();
                if (queryURL != null) {
                  featurelayer = new FeatureLayer({
                    url: queryURL
                  });
                } else {
                  alert("至少选择一个图层查询");
                  return;
                }
              }
              //创建图层所有单值符号面板
              creatsymbolPanel(featurelayer);
              view.graphics.removeAll();
            }
          } else if ($(this).context.title == "初始化") {
            view.graphics.removeAll();
            sketchViewModel.reset();
            $("#divShowResult")[0].innerHTML = "";
            if (graphicslayer != null && iCount != null) {
              clearInterval(iCount);
              graphicslayer.removeAll();
              graphicslayer.refresh();
              graphicslayer = null;
            }
            if (tempGraphicsLayer != null) {
              tempGraphicsLayer.removeAll();
            }
            if ($("#mapCon").find("#waitingdiv").length > 0) {
              $("#mapCon")
                .find("#waitingdiv")
                .remove();
            }
            setActiveButton();
            if(initextent!=null){
              view.extent=initextent;
            }
          }
        });
      // ************************************************************************************
      // 监听图层选择事件
      // ************************************************************************************
      $(".layercotain").on(
        "change",
        ">div:nth-child(2) input[type='radio']",
        function() {
          var queryURL = $(
            ".layercotain ul li input[type='radio']:checked"
          ).val();
          if (queryURL != null) {
            featurelayer = new FeatureLayer({
              url: queryURL
            });
            if ($(".menuactive")[0].title == "添加要素") {
              creatsymbolPanel(featurelayer);
            }
          } else {
            alert("至少选择一个图层查询");
            return;
          }
        }
      );
      // ************************************************************************************
      // 监听符号面板左上角折叠与展开按钮功能事件
      // ************************************************************************************
      $(".symbolpanel").on("click", ">div:first-child a:first-child", function(
        e
      ) {
        if ($(this).context.title == "折叠") {
          $(this)[0].innerText = "▼";
          $(this).context.title = "展开";
        } else {
          $(this)[0].innerText = "▲";
          $(this).context.title = "折叠";
        }
        $(this)
          .parent()
          .parent()
          .find(">div:last-child")
          .toggle(500);
      });
      // ************************************************************************************
      // 监听符号面板右上角关闭面板按钮功能事件
      // ************************************************************************************
      $(".symbolpanel").on("click", ">div:first-child a:last-child", function(
        e
      ) {
        $(this)
          .parent()
          .parent()
          .hide(500);
      });
      // ************************************************************************************
      // 监听符号上单击选择符号功能事件
      // ************************************************************************************
      $(".symbolpanel").on("click", ">div:last-child table tr td div", function(
        e
      ) {
        e.stopPropagation();
        $(this)
          .parent()
          .parent()
          .parent()
          .find("div")
          .removeClass("symbolselect");
        $(this).addClass("symbolselect");

        // var typevalue = $(this).find("a span")[0].innerText;
        //列号
        var cellindex = $(this)
          .parent()
          .parent()
          .find("td")
          .index($(this).parent()[0]);
        //行号
        var rowindex = $(this)
          .parent()
          .parent()
          .parent()
          .find("tr")
          .index(
            $(this)
              .parent()
              .parent()[0]
          );
        //获取当选择的符号
        var editSymbol = editGraphicSymbols[rowindex * 3 + cellindex];

        //点图层
        if (
          editSymbol.type == "picture-marker" ||
          editSymbol.type == "simple-marker"
        ) {
          sketchViewModel.pointSymbol = editSymbol;
          sketchViewModel.create("point");
        }
        //线图层
        else if (editSymbol.type == "simple-line") {
          sketchViewModel.pointSymbol =pointsymbol;
          sketchViewModel.polylineSymbol = editSymbol;
          sketchViewModel.create("polyline");
        }
        //区图层
        else if (
          editSymbol.type == "simple-fill" ||
          editSymbol.type == "picture-fill"
        ) {
          sketchViewModel.pointSymbol =pointsymbol;
          sketchViewModel.polylineSymbol = linesymbol;
          sketchViewModel.polygonSymbol = editSymbol;
          sketchViewModel.create("polygon");
        }
      });

      $("body").on("click", ".layercotain>div a", function(e) {
        //e.stopPropagation();
        $(this)
          .parent()
          .parent()
          .hide(300);
      });

      //取消闪烁
      $("#divShowResult").on("click", "#tabletoolbar a", function(evt) {
        if (graphicslayer != null && iCount != null) {
          clearInterval(iCount);
          graphicslayer.removeAll();
          graphicslayer.refresh();
          graphicslayer = null;
        }
      });

      $("#divShowResult").on(
        "click",
        "#tabletoolbar input[type='button']",
        function(evt) {
          if ($(this).context.value === "提交修改") {
            if (attmodify) {
              //修改要素属性
              if (editFeature) {
                var edits = {
                  updateFeatures: [editFeature]
                };
                applyEdits(edits);
              }
            }
          } else {
            $("#tabletoolbar input[type='button']").css("display", "none");
            $("#tabletoolbar select").css("display", "none");
          }
          $(this)
            .parent()
            .parent()
            .find("input")
            .css("display", "none");
            $(this)
            .parent()
            .parent()
            .find("select")
            .css("display", "none");
          $(this)
            .parent()
            .parent()
            .find("span")
            .css("display", "inline-block");
        }
      );

      // *******************************************
      // 查询结果表格展开与隐藏的单击事件监听
      // *******************************************
      $("#showbtn").bind("click", function() {
        $("#divShowResult").toggle(100, showbtnHandle);
      });
      // *******************************************
      //表格输入框值改变事件监听
      // *******************************************
      $("#divShowResult").on("change", "table tbody tr input", function() {
        if (editFeature) {
          attmodify = true;
          // var graphic = new Graphic();
          // graphic.attributes = {
          //   name: "Spruce",
          //   family: "Pinaceae",
          //   count: 126
          // };
          editFeature.attributes[$(this)[0].name] =
            $(this)[0].type == "text"
              ? $(this).val()
              : new Date($(this).val()).getTime();
        } else {
          alert("请先左键点击选中当前行（要素）！");
        }
      });

      $("#divShowResult").on("change", "table tbody tr select", function() {
        if (editFeature) {
          attmodify = true;
          editFeature.attributes[$(this)[0].name]=$(this).children('option:selected').val();
        }
        else {
          alert("请先左键点击选中当前行（要素）！");
        }
      });

      // *******************************************
      //单击表格的行触发的事件监听
      // *******************************************
      $("#divShowResult").on("click", "table tbody tr", function(e) {
        if (attmodify) {
          return;
        }
        e.stopPropagation();
        $(this)
          .addClass("select")
          .siblings()
          .removeClass("select");

        $(this)
          .parent()
          .find("tr td")
          .find("input")
          .removeClass("select");

        $(this)
          .find("td")
          .find("input")
          .addClass("select");

        if (queryfeatures != null) {
          var graphic = queryfeatures[+$(this)[0].childNodes[0].innerText - 1];

          var flag = true;
          editFeature = graphic;
          if (graphicslayer != null) {
            map.layers.remove(graphicslayer);
            clearInterval(iCount);
            graphicslayer = null;
          }
          graphicslayer = new GraphicsLayer(); //{ graphics: [graphic] }
          map.add(graphicslayer);
          var geometry = graphic.geometry;
          var symbol = getsymbol(graphic.geometry.type);
          var opts = {
            duration: 1000 // Duration of animation will be 5 seconds
          };
          view.goTo(
            {
              target: geometry,
              zoom: 8
            },
            opts
          );
          iCount = setInterval(function() {
            graphicslayer.removeAll();
            var fill = new Graphic();

            if (flag) {
              if (symbol.type == "simple-marker") {
                symbol.outline.width = 8;
                symbol.size = 10;
              } else {
                symbol.color = "rgba(0,0,255,0.9)";
              }

              flag = false;
            } else {
              if (symbol.type == "simple-marker") {
                symbol.outline.width = 4;
                symbol.size = 6;
              } else {
                symbol.color = "rgba(255,0,0,0.9)";
              }
              flag = true;
            }
            fill.symbol = symbol;
            fill.geometry = geometry;
            graphicslayer.graphics.add(fill);
          }, 500);
        }
        if($(this)
          .find("td")
          .find("input").length>0)
          {
            $(this).on("contextmenu", function(e) {
              $(this)
                .parent()
                .find("td")
                .find("input")
                .css("display", "none");
    
              $(this)
                .parent()
                .find("td")
                .find("span")
                .css("display", "block");
    
              $(this).unbind("contextmenu");
    
              var popupmenu = kyoPopupMenu.sys(e);
              l =
                $(document).width() - e.clientX < popupmenu.width()
                  ? e.clientX - popupmenu.width()
                  : e.clientX;
              t =
                $(document).height() - e.clientY < popupmenu.height()
                  ? e.clientY - popupmenu.height()
                  : e.clientY;
              popupmenu.css({ left: l + "px", top: t + "px" }).show();
              return false;
            });
    
            $(this)
              .find("td")
              .find("input")
              .focus(function(e) {
                e.stopPropagation();
              });
          }
      });

      // *******************************************
      //取消表格的行右键菜单
      // *******************************************
      $("#divShowResult")
        .on("contextmenu", "table tbody tr", function(evt) {
          return false;
        })
        .click(function(obj) {
          $(".popup_menu").hide();
        });
    });
  });

  //*************************************************************
  // 激活工具栏按钮功能函数
  //*************************************************************
  function setActiveButton(selectedButton) {
    //聚焦视图以激活草图的键盘快捷键
    view.focus();
    var elements = $(".menuactive");
    for (var i = 0; i < elements.length; i++) {
      $(elements[i]).removeClass("menuactive");
    }
    if (selectedButton) {
      selectedButton.addClass("menuactive");
    }
  }
  //初始化绘图对象
  draw = new Draw({
    view: view //当前视图
  });

  //*************************************************************
  // 根据坐标创建点图形（目前用于单击查询）
  //*************************************************************
  function createPointGraphic(coordinates) {
    view.graphics.removeAll();
    var point = {
      type: "point", // autocasts as /Point
      x: coordinates[0],
      y: coordinates[1],
      spatialReference: view.spatialReference
    };
    var pointgraphic = new Graphic({
      geometry: point,
      symbol: pointsymbol
    });
    view.graphics.add(pointgraphic);
  }

  //*************************************************************
  // 获取地图图层列表
  //*************************************************************
  function getfeaturelayer() {
    var layers = maplayer.sublayers.items;
    var layercontrol = "";
    for (var i = layers.length - 1; i >= 0; i--) {
      var title = layers[i].title;
      var featureurl = layers[i].url.replace(/MapServer/, "FeatureServer");
      var radioinput =
        i == layers.length - 1
          ? "<input type='radio' name='checkquerylayer' value='" +
            featureurl +
            "' checked/>"
          : "<input type='radio' name='checkquerylayer' value='" +
            featureurl +
            "'/>";
      layercontrol =
        layercontrol +
        "<li><div>" +
        radioinput +
        "<span>" +
        title +
        "</span></div></li>";
    }
    var layercontainer =
      "<div>选择操作图层</div><div><ul>" +
      layercontrol +
      "</ul></div><div><a href='#'>×</a></div>";
    $(".layercotain")[0].innerHTML = layercontainer;
    $(".layercotain").show(500);
  }

  //查询属性结果表格
  var atttable = "";
  //新添加的要素
  var featureadd = null;
  //*************************************************************
  //通过查询到的属性字段创建Popup弹窗
  //*************************************************************
  function creatPopupbyqueryFields(geometry) {
    if (featurelayer == null) {
      var queryURL = $(".layercotain ul li input[type='radio']:checked").val();
      if (queryURL != null || queryURL != "") {
        featurelayer = new FeatureLayer({
          url: queryURL
        });
      } else {
        alert("至少选择一个图层查询");
        return;
      }
    }
    //创建等待返回查询结果的提示
    var popupos = [view.center.x, view.center.y];
    var waitingdivpos = view.toScreen(view.center, waitingdivpos);
    if (geometry.type == "polygon") {
      waitingdivpos = view.toScreen(geometry.centroid, waitingdivpos);
      popupos = geometry.centroid;
    } else if (geometry.type == "polyline") {
      popupos = geometry.paths[0][parseInt(geometry.paths[0].length / 2)];
      var point = new Point(popupos);
      waitingdivpos = view.toScreen(point, waitingdivpos);
    } else if (geometry.type == "point") {
      popupos = [geometry.x, geometry.y];
      waitingdivpos = view.toScreen(geometry, waitingdivpos);
    }
    var left = waitingdivpos.x;
    var top = waitingdivpos.y;
    if ($("#mapCon").find("#waitingdiv").length > 0) {
      $("#mapCon")
        .find("#waitingdiv")
        .remove();
    }
    var waitdiv =
      "<div id='waitingdiv' style='z-index:99;position:absolute;left:" +
      left +
      "px;top:" +
      top +
      "px;'><img src='././images/waiting.gif'></div>";
    $("#mapCon").append(waitdiv);

    //查询图层中所有要素
    featurelayer.queryFeatures().then(function(result) {
      //根据查询结果创建属性表格表格
      var featursource = featurelayer.source;
      var typefield = featursource.layer.renderer.field;
      var trs = "";
      for (var i = 0; i < featursource.layer.fields.length; i++) {
        var inputtype = "text";
        var inputvalue = "";
        if (featursource.layer.fields[i].nullable) {
          var readonly = "";
          if (typefield == featursource.layer.fields[i].name) {
            readonly = "readonly";
            inputvalue = $(".symbolpanel").find(
              "table tr td div[class='symbolselect'] span"
            )[0].innerText;
          }

          var classname =
            typefield == featursource.layer.fields[i].name
              ? "readonly"
              : "write";
          if (featursource.layer.fields[i].type === "date") {
            inputtype = "datetime-local";
            var datetime =
              new Date().toLocaleDateString().split("/")[0] +
              "-" +
              new Date().toLocaleDateString().split("/")[1] +
              "-" +
              new Date().toLocaleDateString().split("/")[2] +
              "T" +
              new Date().getHours() +
              ":" +
              new Date().getMinutes() +
              ":" +
              new Date().getSeconds();
            inputvalue = datetime;
          }
          trs +=
            "<tr><td>" +
            featursource.layer.fields[i].name +
            "</td><td><input class='" +
            classname +
            "' type='" +
            inputtype +
            "' placeholder='" +
            featursource.layer.fields[i].type +
            "' value='" +
            inputvalue +
            "'" +
            readonly +
            "/></td></tr>";
        }
      }
      //属性表格
      atttable = "<table border='1' class='atttable'>" + trs + "</table>";
      //填充Popup弹框内容
      var popup = new Popup();
      view.popup = popup;
      popup.content =
        " <div class='wrap'>" +
        "<ul class='blist clearfix'>" +
        "<li class='active'>属性信息</li></ul>" +
        "<ul class='blsit-list'>" +
        "<li>" +
        atttable +
        "</li></ul></div>";
      //添加自定义动作按钮
      popup.actions = [
        {
          id: "AddConfirm",
          image: "./images/confirm.png",
          title: "确认"
        }
      ];

      //打开Popup弹窗
      popup.open({
        title: "添加要素", //标题
        location: popupos //弹窗位置
      });

      //Popup弹窗定位参数
      popup.dockOptions = {
        buttonEnabled: false //切换定位按钮不可用
      };

      //执行自定义按钮的功能
      popup.viewModel.on("trigger-action", function(event) {
        if (event.action.id === "AddConfirm") {
          var symbolid = $(".wrap .blsit-list li .atttable td")
            .find("input[class='readonly']")
            .val();
          if (featureadd != null) {
            var atttrs = $(
              $(".wrap")
                .find(".blsit-list")
                .find("li")
                .find("table")[0]
            ).find("tr");

            var attributes = {};
            for (var i = 0; i < atttrs.length; i++) {
              var key = $($(atttrs[i].childNodes[0])[0]).text();
              var value = $($(atttrs[i].childNodes[1])[0].childNodes[0]).val();
              var valuetype = $(
                $(atttrs[i].childNodes[1])[0].childNodes[0]
              ).attr("placeholder");
              if (valuetype == "date") {
                value = new Date(value).getTime();
              } else {
                if (value != "" && value != null) {
                  value = isNaN(value) ? value : +value;
                }
              }
              if (value != "" && value != null) {
                attributes[key] = value;
              }
            }

            if (symbolid != undefined && symbolid != null && symbolid != "") {
              var symbolfield = $(".wrap .blsit-list li .atttable td")
                .find("input[class='readonly']")
                .parent()
                .parent()
                .find("td:first")[0].innerText;
              attributes[symbolfield] = symbolid;
            }
            featureadd.attributes = attributes; //设置要更新的要素属性信息
            //构建编辑对象
            var edits = {
              addFeatures: [featureadd] //动作:操作要素
            };
            //执行要素编辑功能
            applyEdits(edits);
          }
        }
      });

      if ($("#mapCon").find("#waitingdiv").length > 0) {
        $("#mapCon")
          .find("#waitingdiv")
          .remove();
      }
    });
  }
  //*************************************************************
  //将要素编辑结果（添加、更新、删除）应用到要素图层
  //*************************************************************
  function applyEdits(params) {
    if (graphicslayer != null && iCount != null) {
      clearInterval(iCount);
      graphicslayer.removeAll();
      graphicslayer.refresh();
      graphicslayer = null;
    }
    if (featurelayer == null) {
      var queryURL = $(".layercotain ul li input[type='radio']:checked").val();
      if (queryURL != null) {
        featurelayer = new FeatureLayer({
          url: queryURL
        });
      } else {
        alert("至少选择一个图层查询");
        return;
      }
    }
    var promise = featurelayer.applyEdits(params);
    editResultsHandler(promise);
  }

  // *****************************************************
  // 要素编辑执行结果
  // *****************************************************
  function editResultsHandler(promise) {
    promise
      .then(function(editsResult) {
        //获取要素OID
        var extractObjectId = function(result) {
          return result.objectId;
        };
        //添加要素判断
        if (editsResult.addFeatureResults.length > 0) {
          view.graphics.removeAll();
          view.popup.close();
          view.popup.destroy();
          if (featureadd != null) {
            featureadd.attributes["OBJECTID"] =
              editsResult.addFeatureResults[0].objectId;
          }
          maplayer.refresh();
          alert("添加要素成功！");
        }
        //删除要素判断
        else if (editsResult.deleteFeatureResults.length > 0) {
          for (var i = 0; i < tempGraphicsLayer.graphics.items.length; i++) {
            if (
              tempGraphicsLayer.graphics.items[i].attributes != null &&
              editsResult.deleteFeatureResults[0].objectId ==
                tempGraphicsLayer.graphics.items[i].attributes.OBJECTID
            ) {
              view.graphics.removeAll();
              if (tempGraphicsLayer != null) {
                tempGraphicsLayer.remove(tempGraphicsLayer.graphics.items[i]);
              }
            }
          }
          maplayer.refresh();
          alert("删除要素成功！");
        }
        //更新要素判断
        else if (editsResult.updateFeatureResults.length > 0) {
          if (editsResult.updateFeatureResults[0].objectId != null) {
            editFeature = null;
            attmodify = false;
            for (
              var i = 0;
              i < $("#divShowResult table tbody tr span").length;
              i++
            ) {
            //[class='modeifyspan']
            var spantext= $("#divShowResult table tbody tr span")[i].innerText;
            if( $($("#divShowResult table tbody tr span")[i]).parent().find("input[type='text']").length>0){
              //if( $("#divShowResult table tbody tr input")[i].type == "text"){
                spantext=$($("#divShowResult table tbody tr span")[i]).parent().find("input[type='text']").val();
              //}
            }
           
            else if($($("#divShowResult table tbody tr span")[i]).parent().find("select").length>0){
              spantext=$($("#divShowResult table tbody tr span")[i]).parent().find("select option:selected").val();
            }else if($($("#divShowResult table tbody tr span")[i]).parent().find("input[type='datetime-local']").length>0){
              spantext= new Date(
                //$("#divShowResult table tbody tr input")[i].value
                $($("#divShowResult table tbody tr span")[i]).parent().find("input[type='datetime-local']").val()
              ).getTime();
            }
              $("#divShowResult table tbody tr span")[i].innerText =spantext;
            }
          
            maplayer.refresh();
            alert(
              "OID=" +
                editsResult.updateFeatureResults[0].objectId +
                "的要素属性更新成功！"
            );
          }
        }
      })
      .catch(function(error) {
        console.log("===============================================");
        console.error(
          "[ applyEdits ] FAILURE: ",
          error.code,
          error.name,
          error.message
        );
        console.log("error = ", error);
      });
  }

  // *****************************************************
  // 几何查询（包括单击和拉框）
  // *****************************************************
  function queryGraphic(geometry) {
    if (featurelayer == null) {
      var queryURL = $(".layercotain ul li input[type='radio']:checked").val();
      if (queryURL != null) {
        featurelayer = new FeatureLayer({
          url: queryURL
        });
      } else {
        alert("至少选择一个图层查询");
        return;
      }
    }

    var screenPoint = view.toScreen(view.center, screenPoint);
    if (geometry.type == "point") {
      screenPoint = view.toScreen(geometry, screenPoint);
    } else if (geometry.type == "polygon") {
      screenPoint = view.toScreen(geometry.centroid, screenPoint);
    }
    var left = screenPoint.x;
    var top = screenPoint.y;
    if ($("#mapCon").find("#waitingdiv").length > 0) {
      $("#mapCon")
        .find("#waitingdiv")
        .remove();
    }
    var waitdiv =
      "<div id='waitingdiv' style='z-index:99;position:absolute;left:" +
      left +
      "px;top:" +
      top +
      "px;'><img src='././images/waiting.gif'></div>";
    $("#mapCon").append(waitdiv);

    //创建查询参数对象
    query = featurelayer.createQuery();
    query.units = "meters";
    query.distance = 100;
    //空间查询的几何对象
    query.geometry = geometry;
    //服务器给我们返回的字段信息，*代表返回所有字段
    query.outFields = ["*"];
    //空间参考信息
    query.outSpatialReference = view.spatialReference;
    //查询的标准，此处代表和geometry相交的图形都要返回
    query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
    //是否返回几何信息
    query.returnGeometry = true;
    //执行空间查询
    featurelayer
      .queryFeatures(query)
      .then(showQueryResult)
      .catch(function(error) {
        console.log(error);
      });
  }

  // *****************************************************
  //根据几何类型获取对应符号，用于查询结果高亮
  // *****************************************************
  function getsymbol(geometryType) {
    var hilightSym = null;
    if (geometryType == "point" || geometryType == "mulitpoint") {
      hilightSym = {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        size: 6,
        color: "rgba(178,34,34,0.8)",
        outline: {
          color: [255, 64, 0, 0.4],
          width: 4
        }
      };
    } else if (geometryType == "polyline") {
      hilightSym = {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: "rgba(255,0,0,0.3)",
        width: "5px",
        style: "solid"
      };
    } else {
      //创建线符号
      var lineSymbol = new SimpleLineSymbol(
        SimpleLineSymbol.STYLE_DASH,
        new dojo.Color([255, 0, 0]),
        1
      );
      //创建面符号
      hilightSym = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        lineSymbol
      );
    }
    return hilightSym;
  }

  // *****************************************************
  // 创建查询结果展示表格
  // *****************************************************
  var queryfeatures = null;
  function showQueryResult(queryResult) {
    var geometryType = queryResult.geometryType;
    if (queryResult.features.length == 0) {
      $("#divShowResult")[0].innerHTML = "";
      return;
    }
    var htmls =
      "<div id='tabletoolbar'><input type='button' style='left:0px;' value='提交修改'/><input type='button'style='left:50px;' value='取消'/>" +
      "查询结果<a href='#' title='取消闪烁' style='text-decoration: none;right: 20px;position: absolute;'>" +
      "<img src='././images/stopflash.png' style='width: 24px;height: 24px;'></a></div>";
    if (queryResult.features.length >= 1) {
      queryfeatures = queryResult.features;
      //构造表格
      var thead = "<thead><tr><th>序号</th>";
      for (var i = 0; i < queryResult.fields.length; i++) {
        thead += "<th>" + queryResult.fields[i].name + "</th>";
      }
      thead += "</tr></thead>";
      htmls =
        htmls +
        "<div id='resulttable'><table border='1' cellpadding='10' width='100%'>" +
        thead +
        "<tbody>";
      var trs = "";
      for (var i = 0; i < queryResult.features.length; i++) {
        //得到graphic
        var graphic = new Graphic();
        //var graphic = queryResult.features[i];
        //给图形赋予符号
        if (getsymbol(geometryType) != null) {
          graphic.symbol = getsymbol(geometryType);
          graphic.geometry = queryResult.features[i].geometry;
        }
        //添加到地图从而实现高亮效果
        view.graphics.add(graphic);
        var attributes = queryResult.features[i].attributes;
        var tds = "<td><span>" + (i + 1) + "</span></td>";
        for (var j = 0; j < queryResult.fields.length; j++) {
          var inputtype = "text";
          var key = queryResult.fields[j].name;
          var inputvalue = attributes[key];
          var spanvalue = attributes[key];
          if (queryResult.fields[j].type == "date") {
            inputtype = "datetime-local";
            inputvalue = DateFormat(inputvalue);
          }

          if (
            queryResult.fields[j].type != "geometry" &&
            queryResult.fields[j].type != "oid" &&
            queryResult.fields[j].type != "global-id"
          ) {
            if(queryResult.features[i].layer.typeIdField==queryResult.fields[j].name){
               if(featurelayer!=null)
               {
                var select=initTypeValueList(featurelayer,spanvalue);
                tds += "<td>"+select+"<span class='modeifyspan'>" +spanvalue+ "</span></td>";
               }
            }
            else{
              tds +=
              "<td><input type='" +
              inputtype +
              "' name='" +
              key +
              "'value='" +
              inputvalue +
              "'/><span class='modeifyspan'>" +
              spanvalue +
              "</span></td>";
            }
   
          } else {
              tds += "<td><span>" + attributes[key] + "</span></td>";
          }
        }
        trs = trs + "<tr>" + tds + "</tr>";
      }
      htmls = htmls + trs + "</tbody></table></div>";
      $("#divShowResult")[0].innerHTML = htmls;
      if ($("#mapCon").find("#waitingdiv").length > 0) {
        $("#mapCon")
          .find("#waitingdiv")
          .remove();
      }
      if ($("#divShowResult").css("display") != "block") {
        $("#divShowResult").toggle(100, showbtnHandle);
      }
    }
  }
  function initTypeValueList(featurelayer,selecttext){
   var uniqueValueInfos=featurelayer.renderer.uniqueValueInfos;
    var options="";
    for(var i=0;i<uniqueValueInfos.length;i++){
     if(uniqueValueInfos[i].value==selecttext){
      options=options+"<option value ='"+uniqueValueInfos[i].value+"' selected>"+uniqueValueInfos[i].value+"</option>"
     }
     else{
      options=options+"<option value ='"+uniqueValueInfos[i].value+"'>"+uniqueValueInfos[i].value+"</option>";
     }
    }
    var select="<select name='"+featurelayer.typeIdField+"'>"+options+"</select>";
    return select;
  }
  var angle = 180;
  function showbtnHandle() {
    var visible = $("#divShowResult").css("display");
    visible == "block"
      ? $("#showbtn").css("bottom", "30%")
      : $("#showbtn").css("bottom", "0px");
    $("#showbtn")
      .find("img")
      .css("transform", "rotateX(" + angle + "deg)");
    angle = angle - 180;
  }

  function add0(m) {
    return m < 10 ? "0" + m : m;
  }
  // *****************************************************
  // 时间戳转成指定格式的时间
  // *****************************************************
  function DateFormat(shijianchuo) {
    //shijianchuo是整数，否则要parseInt转换
    var time = new Date(shijianchuo);
    var y = time.getFullYear();
    var m = time.getMonth() + 1;
    var d = time.getDate();
    var h = time.getHours();
    var mm = time.getMinutes();
    var s = time.getSeconds();
    return (
      y +
      "-" +
      add0(m) +
      "-" +
      add0(d) +
      "T" +
      add0(h) +
      ":" +
      add0(mm) +
      ":" +
      add0(s)
    );
  }

  var graphicslayer = null;
  var iCount = null;
  var editFeature = null;
  // $(function() {
    // $("body").on("click", ".blist li", function() {
    //   var index = $(this).index();
    //   $(this)
    //     .addClass("active")
    //     .siblings()
    //     .removeClass("active");
    //   $(this)
    //     .parents(".wrap")
    //     .find(".blsit-list li")
    //     .eq(index)
    //     .show()
    //     .siblings()
    //     .hide();
    // });
  // });
  // *******************************************
  //动态创建表格的行右键菜单
  // *******************************************
  var kyoPopupMenu = {};
  kyoPopupMenu = (function() {
    return {
      sys: function(obj) {
        $(".popup_menu").remove();
        popupMenuApp = $(
          '<div class="popup_menu app-menu"><ul><li><a menu="menu1">修改属性</a></li><li><a menu="menu2">删除要素</a></li></ul></div>'
        )
          .find("a")
          .attr("href", "javascript:;")
          .end()
          .appendTo("body");
        //绑定修改事件
        $('.app-menu a[menu="menu1"]').on("click", function() {
          for (
            var i = 0;
            i <
            $(obj.currentTarget) //[type='text']
              .find("td")
              .find("input").length;
            i++
          ) {
            var extendwidth =
              $(obj.currentTarget)
                .find("td")
                .find("input")[i].type == "text"
                ? 0
                : 80;
            $(obj.currentTarget)
              .find("td")
              .find("input")[i].style.width = $(obj.currentTarget).find(
              "td span[class='modeifyspan']"
            )[i].currentStyle
              ? $(obj.currentTarget).find("td span[class='modeifyspan']")[i].currentStyle.width
              : window.getComputedStyle(
                  $(obj.currentTarget).find("td span[class='modeifyspan']")[i],
                  null
                ).width;

            $(obj.currentTarget)
              .find("td")
              .find("input")[i].style.width =
              +$(obj.currentTarget)
                .find("td")
                .find("input")
                [i].style.width.slice(
                  0,
                  $(obj.currentTarget)
                    .find("td")
                    .find("input")[i].style.width.length - 2
                ) +
              extendwidth +
              "px";
          }

          $(obj.currentTarget)
          .find("td")
          .find("input")
          .css("display", "block");
          $(obj.currentTarget)
          .find("td")
          .find("select")
          .css("display", "block");
        $(obj.currentTarget)
          .find("td")
          .find("span[class='modeifyspan']")
          .css("display", "none");

          $(obj.currentTarget).find("td").find("select")[0].style.width=$(obj.currentTarget).find("td").find("select").parent().find("span")[0].currentStyle
          ? $(obj.currentTarget).find("td").find("select").parent().find("span")[0].currentStyle.width
          : window.getComputedStyle(
              $(obj.currentTarget).find("td").find("select").parent().find("span")[0],
              null
            ).width;

            $(obj.currentTarget).find("td").find("select")[0].style.height="95%";
           
          $(".popup_menu").hide();
          $("#tabletoolbar input[type='button']").css("display", "block");
        });
        //绑定删除事件
        $('.app-menu a[menu="menu2"]').on("click", function() {
          $(obj.currentTarget).remove();
          var length = $(obj.delegateTarget)
            .find("table")
            .find("tbody")
            .find("tr").length;
          for (var i = 1; i <= length; i++) {
            $(
              $(obj.delegateTarget)
                .find("table")
                .find("tbody")
                .find("tr")[i - 1]
            )
              .find("td:first")
              .html(i.toString());
          }
          $(".popup_menu").hide();
          if (editFeature != null) {
            var edits = {
              deleteFeatures: [editFeature]
            };
            applyEdits(edits);
          }
        });
        return popupMenuApp;
      }
    };
  })();
});
