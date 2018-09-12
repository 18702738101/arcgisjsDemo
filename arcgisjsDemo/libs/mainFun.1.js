//绘图
var draw;
//当前视图
var view;
//当前地图
var map;

let editGraphic;

var featurelayer = null;

//动态裁图图层（底图）
var maplayer;
//"http://192.168.56.102:6080/arcgis/rest/services/DLTB/MapServer"; //
//已发布地图文档的rest地址
var MapURL = "http://192.168.56.102:6080/arcgis/rest/services/zj/MapServer"; //"http://192.168.56.102:6080/arcgis/rest/services/DLTB/MapServer"; //"http://192.168.56.102:6080/arcgis/rest/services/DLTBFeatureLayer/MapServer"
var featureURL =
  "	http://192.168.56.102:6080/arcgis/rest/services/zj/FeatureServer";
//"http://192.168.56.102:6080/arcgis/rest/services/DLTB/FeatureServer";
//默认点图形参数
var pointsymbol = {
  type: "simple-marker",
  color: "rgba(255,0,0,0.8)",
  size: 8,
  outline: {
    width: 1,
    color: "#f0d524"
  }
};
//默认线图形参数
var linesymbol = {
  type: "dash",
  color: "rgba(255,0,0,0.8)",
  width: 1
};
var fillsymbol = {
  type: "simple-fill",
  color: "rgba(255,0,0,0.5)",
  outline: {
    // autocasts as new SimpleLineSymbol()
    type: "solid",
    color: "rgba(26, 154, 228,0.8)",
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
  // GraphicsLayer to hold graphics created via sketch view model
  const tempGraphicsLayer = new GraphicsLayer();
  //初始化动态裁图图层
  maplayer =
    //  new FeatureLayer({
    //   url:
    //   featureURL
    //   //"http://192.168.56.102:6080/arcgis/rest/services/DLTB/MapServer/0"
    //   //"http://192.168.56.102:6080/arcgis/rest/services/DLTB/FeatureServer"
    // });

    new MapImageLayer({
      url: MapURL
    });

  // new TileLayer({
  //   url: "http://192.168.56.102:6080/arcgis/rest/services/DLTBTile/MapServer"
  // });

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

  view.when(function() {
    // create a new sketch view model
    const sketchViewModel = new SketchViewModel({
      view: view,
      layer: tempGraphicsLayer,
      pointSymbol: {
        type: "simple-marker",
        color: "rgba(255,0,0,0.8)",
        size: 6,
        outline: {
          width: 1,
          color: "#f0d524"
        }
      },
      polylineSymbol: {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: "rgb(255,215,0)",
        width: "2",
        style: "solid"
      },
      polygonSymbol: {
        type: "simple-fill", // autocasts as new SimpleFillSymbol()
        color: "rgba(128,128,128,0.6)",
        style: "solid",
        outline: {
          color: "rgba(255,0,0,0.8)",
          width: 1
        }
      }
    });
    setUpClickHandler();
    sketchViewModel.on("move", updateGraphic);
    // Listen to create-complete event to add a newly created graphic to view
    sketchViewModel.on("create-complete", addGraphic);

    // Listen the sketchViewModel's update-complete and update-cancel events
    sketchViewModel.on("update-complete", updateGraphic);
    sketchViewModel.on("update-cancel", updateGraphic);

    //*************************************************************
    // called when sketchViewModel's create-complete event is fired.
    //*************************************************************
    function addGraphic(event) {
      // Create a new graphic and set its geometry to
      // `create-complete` event geometry.
      const graphic = new Graphic({
        geometry: event.geometry,
        symbol: sketchViewModel.graphic.symbol
      });
      if (event.tool != "rectangle") {
        tempGraphicsLayer.add(graphic);
        if (featurelayer != null) {
        }
      } else {
        queryGraphic(event.geometry);
      }
    }

    function creatsymbolPanel(featurelayer) {
      featurelayer.queryFeatures().then(function(result) {
        //根据查询结果创建属性表格和图形参数表格
        var featursource = featurelayer.source;

        var uniqueValueInfos = featursource.layer.renderer.uniqueValueInfos;
        var content = "";
        if (uniqueValueInfos != undefined || uniqueValueInfos != null) {
          var tds = "";
          for (var i = 0; i < uniqueValueInfos.length; i++) {
            var symbol = uniqueValueInfos[i].symbol;
            var symboltype = symbol.type;
            var svg = "";
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
            } else if (symboltype == "simple-fill") {
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
                  //  svg =
                  //   "<td><div><a><svg  overflow='hidden' width='50px' height='50px' version='1.1'" +
                  //   "xmlns='http://www.w3.org/2000/svg'>" +
                  //   "<polygon points='25,10 45,35 15,40 10,25'" +
                  //   "style='fill:" +
                  //   fillcolor +
                  //   ";stroke:" +
                  //   outlinecolor +
                  //   ";stroke-width:" +
                  //   outlinewidth +
                  //   "'/></svg>";
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
            } else if (symboltype == "picture-fill") {
              var id=symbol.id;
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
                " style='touch-action: none;'><defs><pattern id='"+id+"'" +
                " patternUnits='userSpaceOnUse' x='0.00000000' y='0.00000000'" +
                " width='"+width+"' height='"+height+"'><image x='0' y='0'" +
                " width='" +
                width +
                "' height='" +
                height +
                "'" +
                " xlink:href='" +
                imgurl +
                "'></image></pattern></defs>" +
                "<path fill='url(#"+id+")' stroke='" +
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
            } else if (symboltype == "picture-marker") {
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
          if(tds!="")
          {
            content = content + "<tr>"+tds+"</tr>";
          }
        } else {
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
          } else {
          }
        }

        var symboltable =
          "<table border='0' class='symboltable'>" + content + "</table>";

        var content =
          "<div>" + featurelayer.title + "</div><div>" + symboltable + "</div>";
        $(".symbolpanel")[0].innerHTML = content;
        $(".symbolpanel").show(500);
      });
    }

    //***************************************************************
    // called when sketchViewModel's update-complete or update-cancel
    // events are fired.
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
    // set up logic to handle geometry update and reflect the update on "tempGraphicsLayer"
    // ************************************************************************************
    function setUpClickHandler() {
      view.on("click", function(event) {
        view.hitTest(event).then(function(response) {
          var results = response.results;
          // Found a valid graphic
          if (results.length && results[results.length - 1].graphic) {
            // Check if we're already editing a graphic
            if (!editGraphic) {
              // Save a reference to the graphic we intend to update
              editGraphic = results[results.length - 1].graphic;
              // Remove the graphic from the GraphicsLayer
              // Sketch will handle displaying the graphic while being updated
              tempGraphicsLayer.remove(editGraphic);
              sketchViewModel.update(editGraphic);
            }
          }
        });
      });
    }
    $(function() {
      $(".toolbar")
        .find("img")
        .bind("click", function() {
          attmodify = false;
          if ($(this).context.title == "单击查询") {
            if (draw != null) {
              if (graphicslayer != null && iCount != null) {
                //清除计时器
                clearInterval(iCount);
                graphicslayer.removeAll();
                //graphicslayer.refresh();
                graphicslayer = null;
              }
              if ($(".layercotain")[0].innerHTML == "") {
                getfeaturelayer();
              } else {
                $(".layercotain").show(300);
              }
              var action = draw.create("point", { mode: "click" });
              action.on("cursor-update", function(evt) {
                createPointGraphic(evt.coordinates);
              });

              // 绘制点完成事件
              // Create a point when user clicks on the view or presses "C" key.
              action.on("draw-complete", function(evt) {
                createPointGraphic(evt.coordinates);
                var point = {
                  type: "point", // autocasts as /Point
                  x: evt.coordinates[0],
                  y: evt.coordinates[1],
                  spatialReference: view.spatialReference
                };
                queryGraphic(point);
              });
            }
          } else if ($(this).context.title == "拉框查询") {
            if (draw != null) {
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
              //sketchViewModel.create("point");
              view.graphics.removeAll();
              sketchViewModel.create("rectangle");
              // var freeaction = draw.create("rectangle");
              // freeaction.on("vertex-add", createRectGraphic);
              // freeaction.on("cursor-update", createRectGraphic);
              // freeaction.on("vertex-remove", createRectGraphic);
              // freeaction.on("draw-complete", createRectGraphic);
            }
          } else if ($(this).context.title == "添加要素") {
            if (draw != null) {
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
                    url: queryURL //MapURL + "/" + queryLayerIndex//图层地址
                  });
                } else {
                  alert("至少选择一个图层查询");
                  return;
                }
              }
              creatsymbolPanel(featurelayer);
              view.graphics.removeAll();
            }
          } else if ($(this).context.title == "初始化") {
            view.graphics.removeAll();
            $("#divShowResult")[0].innerHTML = "";
            if (graphicslayer != null && iCount != null) {
              clearInterval(iCount);
              graphicslayer.removeAll();
              graphicslayer.refresh();
              graphicslayer = null;
            }
          }
        });

      $(".layercotain").on(
        "change",
        ">div:nth-child(2) input[type='radio']",
        function() {
          var queryURL = $(
            ".layercotain ul li input[type='radio']:checked"
          ).val();
          if (queryURL != null) {
            featurelayer = new FeatureLayer({
              url: queryURL //MapURL + "/" + queryLayerIndex//图层地址
            });
            creatsymbolPanel(featurelayer);
          } else {
            alert("至少选择一个图层查询");
            return;
          }
        }
      );

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

        var typevalue = $(this).find("a span")[0].innerText;
        // featurelayer.queryFeatures().then(function(result) {
        //
        //   //addDraw(result.geometryType);
        //   if (
        //     result.geometryType == "point" ||
        //     result.geometryType == "mulitpoint"
        //   ) {
        //
        //   } else if (result.geometryType == "polyline") {
        //     sketchViewModel.create("polyline");
        //   } else {
        //     sketchViewModel.create("polygon");
        //   }
        // });
        if ($(this).find("svg image").length > 0) {
          var picwidth = +$(this)
            .find("svg image")
            .attr("width");
          var picheight = +$(this)
            .find("svg image")
            .attr("height");
          var picurl = $(this)
            .find("svg image")
            .attr("xlink:href");
          sketchViewModel.pointSymbol = {
            type: "picture-marker",
            color: "rgba(255,0,0,0.8)",
            width: picwidth,
            height: picheight,
            url: picurl
          };
          sketchViewModel.create("point");
        } else if ($(this).find("svg path").length > 0) {
          //区图层
          if (
            $(this)
              .find("svg path")
              .attr("fill") != "none"
          ) {
            sketchViewModel.polygonSymbol = {
              type: "simple-fill",
              color: $(this)
                .find("svg path")
                .attr("fill"),
              style: "solid",
              outline: {
                color: "rgba(255,0,0,0.8)",
                width: 1
              }
            };

            sketchViewModel.create("polygon");
          }
          //线图层
          else {
            var linecolor = $(this)
              .find("svg path")
              .attr("stroke");
            var linewidth = +$(this)
              .find("svg path")
              .attr("stroke-width");
            var linestyle = $(this)
              .find("svg path")
              .attr("dojogfxstrokestyle");
            sketchViewModel.polylineSymbol = {
              type: "simple-line", // autocasts as new SimpleLineSymbol()
              color: linecolor,
              width: linewidth,
              cap: $(this)
                .find("svg path")
                .attr("stroke-linecap"),
              join: $(this)
                .find("svg path")
                .attr("stroke-linejoin"),
              miterLimit: +$(this)
                .find("svg path")
                .attr("stroke-miterlimit"),
              style: linestyle
            };
            sketchViewModel.create("polyline");
          }
        }
        // $(".wrap .blsit-list li .atttable td")
        //   .find("input[class='readonly']")
        //   .val(typevalue);
      });
    });
  });

  //初始化绘图对象
  draw = new Draw({
    view: view //当前视图
  });

  //根据坐标创建点图形（目前用于单击查询）
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

  //根据坐标创建矩形（目前用于拉框查询）
  function createRectGraphic(evt) {
    view.graphics.removeAll();
    if (evt.vertices.length < 2) {
      return;
    }
    //创建矩形对象
    var extent = new Extent({
      xmin: evt.vertices[0][0],
      ymin: evt.vertices[0][1],
      xmax: evt.vertices[1][0],
      ymax: evt.vertices[1][1],
      spatialReference: view.spatialReference
    });
    //创建线符号
    var lineSymbol = new SimpleLineSymbol(
      SimpleLineSymbol.STYLE_DASH,
      new Color([255, 0, 0]),
      1
    );
    //创建面符号
    var fill = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, lineSymbol);
    //创建矩形
    var graphic = new Graphic({
      geometry: extent,
      symbol: fill
    });
    view.graphics.add(graphic); //将创建的矩形添加到视图
    //判断是否绘制完成
    if (evt.type == "draw-complete") {
      view.graphics.removeAll();
      //查询要素
      queryGraphic(extent);
      return;
    }
  }
  function getfeaturelayer() {
    var layers = maplayer.sublayers.items;
    var layercontrol = "";
    for (var i = layers.length - 1; i >= 0; i--) {
      //var id = layers[i].id;
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
  var atttable = "";

  //新添加的要素
  var featureadd = null;
  //通过查询到的属性字段创建Popup弹窗
  function creatPopupbyqueryFields(pos) {
    var queryURL = $(".layercotain ul li input[type='radio']:checked").val();
    var featurelayer = null;
    if (queryURL != null) {
      featurelayer = new FeatureLayer({
        url: queryURL //MapURL + "/" + queryLayerIndex//图层地址
      });
    } else {
      alert("至少选择一个图层查询");
      return;
    }
    featurelayer.queryFeatures().then(function(result) {
      //根据查询结果创建属性表格和图形参数表格
      var featursource = featurelayer.source;
      var typefield = featursource.layer.renderer.field;
      var trs = "";
      for (var i = 0; i < featursource.layer.fields.length; i++) {
        var inputtype = "text";
        var inputvalue = "";
        if (featursource.layer.fields[i].nullable) {
          var readonly =
            typefield == featursource.layer.fields[i].name ? "readonly" : "";
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
      //图形参数表格
      // var symbol =
      //   "<table border='1' class='atttable'>" +
      //   "<tr><td name='_type'>填充样式</td><td><select><option value='simple-fill'>一般填充</option><option value='picture-fill'>图片填充</option></select></td></tr>" +
      //   "<tr><td name='_color'>填充色</td><td><input type='color'></td></tr>" +
      //   "<tr><td name='outline_style'>边界线样式</td><td><select><option value='solid'>实线</option><option value='dash'>虚线</option><option value='none'>none</option></select></td></tr>" +
      //   "<tr><td name='outline_color'>边界线颜色</td><td><input type='color'></td></tr>" +
      //   "<tr><td name='outline_width'>线宽</td><td><input type='number' value='1'></td></tr>" +
      //   "</table>";
      var uniqueValueInfos = featursource.layer.renderer.uniqueValueInfos;
      var tds = "";
      var content = "";
      for (var i = 0; i < uniqueValueInfos.length; i++) {
        var symbol = uniqueValueInfos[i].symbol;
        var symboltype = symbol.type;

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
        //#cccccc
        var svg =
          "<td><div><svg width='50px' height='50px' version='1.1'" +
          "xmlns='http://www.w3.org/2000/svg'>" +
          "<polygon points='25,10 45,35 15,40 10,25'" +
          "style='fill:" +
          fillcolor +
          ";stroke:" +
          outlinecolor +
          ";stroke-width:" +
          outlinewidth +
          "'/></svg>";

        if ((i + 1) % 3 == 0) {
          tds =
            "<tr>" +
            tds +
            svg +
            "</br><a>" +
            uniqueValueInfos[i].label +
            "</a></td></div></tr>";
          content = content + tds;
          tds = "";
        } else {
          tds =
            tds +
            svg +
            "<br/><a>" +
            uniqueValueInfos[i].label +
            "</a></div></td>";
        }
      }
      var symboltable =
        "<table border='0' class='symboltable'>" + content + "</table>";

      //var symboltable = "<div>"+tablehtml+"</div>";
      //填充Popup弹框内容
      var popup = new Popup();
      view.popup = popup;
      popup.content =
        " <div class='wrap'>" +
        "<ul class='blist clearfix'>" +
        "<li class='active'>属性信息</li><li>图形信息</li></ul>" +
        "<ul class='blsit-list'>" +
        "<li>" +
        atttable +
        "</li><li>" +
        symboltable +
        "</li></ul></div>";
      //添加自定义动作按钮
      popup.actions = [
        {
          id: "AddConfirm",
          image: "./images/confirm.png",
          title: "确认"
        }
      ];
      //view.popup.renderNow();
      //打开Popup弹窗
      popup.open({
        title: "添加要素", //标题
        location: pos //弹窗位置
      });
      //Popup弹窗定位参数
      popup.dockOptions = {
        buttonEnabled: false //切换定位按钮不可用
      };
      //popup.view=view;
      popup.emit("close", function() {
        alert("关闭");
      });
      //执行自定义按钮的功能
      popup.viewModel.on("trigger-action", function(event) {
        if (event.action.id === "AddConfirm") {
          var symbolid = $(".wrap .blsit-list li .atttable td")
            .find("input[class='readonly']")
            .val();
          if (symbolid == "undefined" || symbolid == null || symbolid == "") {
            alert("请选择图形信息");
            return;
          }
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
            var symbolfield = $(".wrap .blsit-list li .atttable td")
              .find("input[class='readonly']")
              .parent()
              .parent()
              .find("td:first")[0].innerText;
            attributes[symbolfield] = symbolid;
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
    });
  }

  function applyEdits(params) {
    //view.graphics.removeAll();
    if (graphicslayer != null && iCount != null) {
      clearInterval(iCount);
      graphicslayer.removeAll();
      graphicslayer.refresh();
      graphicslayer = null;
    }
    var queryURL = $(".layercotain ul li input[type='radio']:checked").val();
    var featurelayer = null;
    if (queryURL != null) {
      featurelayer = new FeatureLayer({
        url: queryURL
      });
    } else {
      alert("至少选择一个图层查询");
      return;
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
          maplayer.refreshInterval = 1 / 60;
          maplayer.refresh();
          alert("添加要素成功！");
        }
        //删除要素判断
        else if (editsResult.deleteFeatureResults.length > 0) {
          for (var i = 0; i < view.graphics.items.length; i++) {
            if (
              view.graphics.items[i].attributes != null &&
              editsResult.deleteFeatureResults[0].objectId ==
                view.graphics.items[i].attributes.OBJECTID
            ) {
              view.graphics.remove(view.graphics.items[i]);
            }
          }
          maplayer.refreshInterval = 1 / 60;
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
              $("#divShowResult table tbody tr span")[i].innerText =
                $("#divShowResult table tbody tr input")[i].type == "text"
                  ? $("#divShowResult table tbody tr input")[i].value
                  : new Date(
                      $("#divShowResult table tbody tr input")[i].value
                    ).getTime();
            }
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
  //几何查询
  function queryGraphic(geometry) {
    //创建查询对象，注意：服务的后面有一个编号，代表对那一个图层进行查询
    // var queryTask = new QueryTask(
    //   MapURL + "/" + queryLayerIndex //图层地址
    // //"http://192.168.56.102:6080/arcgis/rest/services/DLTB/MapServer/0"
    // );
    // //创建查询参数对象
    // var query = new Query();
    var queryURL = $(".layercotain ul li input[type='radio']:checked").val();
    var featurelayer = null;
    if (queryURL != null) {
      featurelayer = new FeatureLayer({
        url: queryURL //MapURL + "/" + queryLayerIndex//图层地址
      });
    } else {
      alert("至少选择一个图层查询");
      return;
    }
    // featurelayer.when(function(){
    //   if (featurelayer.capabilities.operations.supportsAdd) {
    //     // if new features can be created in the layer
    //     // set up the UI for editing

    //   }
    // });
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
    featurelayer.queryFeatures(query).then(showQueryResult);
  }
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
  //查询到的要素
  var queryfeatures = null;
  function showQueryResult(queryResult) {
    var geometryType = queryResult.geometryType;

    if (queryResult.features.length == 0) {
      $("#divShowResult")[0].innerHTML = "";
      return;
    }
    var htmls =
      "<div id='tabletoolbar'><input type='button' style='left:0px;' value='提交修改'/><input type='button'style='left:50px;' value='取消'/>查询结果</div>";
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
        var tds = "<td>" + (i + 1) + "</td>";
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
            tds +=
              "<td><input type='" +
              inputtype +
              "' name='" +
              key +
              "'value='" +
              inputvalue +
              "'/><span>" +
              spanvalue +
              "</span></td>";
          } else {
            tds += "<td>" + attributes[key] + "</td>";
          }
        }
        trs = trs + "<tr>" + tds + "</tr>";
      }
      htmls = htmls + trs + "</tbody></table></div>";
      $("#divShowResult")[0].innerHTML = htmls;
      if ($("#divShowResult").css("display") != "block") {
        $("#divShowResult").toggle(100, resizemap);
      }
    }
  }

  function drawPolygon(vertices) {
    //移除已有的全部图形
    view.graphics.removeAll();
    //创建一个新的多边形对象
    var polygon = createPolygon(vertices);

    //通过多边形对象创建新图形病添加到二维视图中
    featureadd = createGraphic(polygon);
    view.graphics.add(featureadd);
    if (event.type == "draw-complete") {
      creatPopupbyqueryFields(polygon.centroid);
    }
  }
  function drawLine(vertices) {
    view.graphics.removeAll();
  }
  // 通过提供的坐标点创建多边形
  function createPolygon(vertices) {
    return new Polygon({
      type: "polygon",
      rings: vertices,
      spatialReference: view.spatialReference
    });
  }

  //将正在绘制的多边形创建成新图形
  function createGraphic(polygon) {
    graphic = new Graphic({
      geometry: polygon,
      symbol: {
        type: "simple-fill",
        color: [178, 102, 234, 0.8],
        style: "solid",
        outline: {
          color: [255, 0, 0, 0.8],
          width: 2
        }
      }
    });
    return graphic;
  }

  //调整地图视图的尺寸
  var angle = 180;
  function resizemap() {
    var visible = $("#divShowResult").css("display");
    visible == "block"
      ? $("#showbtn").css("bottom", "30%")
      : $("#showbtn").css("bottom", "0px");
    $("#showbtn")
      .find("img")
      .css("transform", "rotateX(" + angle + "deg)");
    angle = angle - 180;
  }

  //时间戳转时间
  function add0(m) {
    return m < 10 ? "0" + m : m;
  }
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
  function addDraw(layertype) {
    if (geometryType == "point" || geometryType == "mulitpoint") {
      var action = draw.create("point", { mode: "click" });
      action.on("cursor-update", function(evt) {
        createPointGraphic(evt.coordinates);
      });

      // 绘制点完成事件
      // Create a point when user clicks on the view or presses "C" key.
      action.on("draw-complete", function(evt) {
        createPointGraphic(evt.coordinates);
        var point = {
          type: "point", // autocasts as /Point
          x: evt.coordinates[0],
          y: evt.coordinates[1],
          spatialReference: view.spatialReference
        };
        var action = draw.create("point", { mode: "click" });
        view.focus();
        action.on("cursor-update", function(evt) {
          createPointGraphic(evt.coordinates);
        });

        // 绘制点完成事件
        // Create a point when user clicks on the view or presses "C" key.
        action.on("draw-complete", function(evt) {
          createPointGraphic(evt.coordinates);
          var point = {
            type: "point", // autocasts as /Point
            x: evt.coordinates[0],
            y: evt.coordinates[1],
            spatialReference: view.spatialReference
          };
          queryGraphic(point);
        });
      });
    } else if (geometryType == "polyline") {
      var action = draw.create("polyline", { mode: "click" });
      view.focus();
      // fires when a vertex is added
      action.on("vertex-add", function(evt) {
        drawLine(evt.vertices);
      });
      // fires when the pointer moves
      action.on("cursor-update", function(evt) {
        drawLine(evt.vertices);
      });
      // fires when the drawing is completed
      action.on("draw-complete", function(evt) {
        drawLine(evt.vertices);
      });
      // fires when a vertex is removed
      action.on("vertex-remove", function(evt) {
        drawLine(evt.vertices);
      });
    } else {
      var polygonaction = draw.create("polygon", { mode: "click" });
      view.focus();
      // 监听坐标点添加事件
      polygonaction.on("vertex-add", function(evt) {
        drawPolygon(evt.vertices);
      });
      // 监听光标更新（鼠标移动）事件
      polygonaction.on("cursor-update", function(evt) {
        drawPolygon(evt.vertices);
      });
      // 监听坐标点移除事件
      polygonaction.on("vertex-remove", function(evt) {
        drawPolygon(evt.vertices);
      });
      // *******************************************
      // 监听绘制完成事件
      // *******************************************
      polygonaction.on("draw-complete", function(evt) {
        drawPolygon(evt.vertices);
      });
    }
  }
  var graphicslayer = null;
  var iCount = null;
  var editFeature = null;
  $(function() {
    $("body").on("click", ".blist li", function() {
      var index = $(this).index();
      $(this)
        .addClass("active")
        .siblings()
        .removeClass("active");
      $(this)
        .parents(".wrap")
        .find(".blsit-list li")
        .eq(index)
        .show()
        .siblings()
        .hide();
    });

    $("body").on("click", ".layercotain>div a", function(e) {
      //e.stopPropagation();
      $(this)
        .parent()
        .parent()
        .hide(300);
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
        }
        $(this)
          .parent()
          .parent()
          .find("input")
          .css("display", "none");
        $(this)
          .parent()
          .parent()
          .find("span")
          .css("display", "inline-block");
      }
    );

    // $(".toolbar")
    //   .find("img")
    //   .bind("click", function() {
    //     attmodify = false;
    //     if ($(this).context.title == "单击查询") {
    //       if (draw != null) {
    //         if (graphicslayer != null && iCount != null) {
    //           //清除计时器
    //           clearInterval(iCount);
    //           graphicslayer.removeAll();
    //           //graphicslayer.refresh();
    //           graphicslayer = null;
    //         }
    //         if ($(".layercotain").length == 0) {
    //           getfeaturelayer();
    //         } else {
    //           $(".layercotain").show(300);
    //         }
    //         var action = draw.create("point", { mode: "click" });
    //         action.on("cursor-update", function(evt) {
    //           createPointGraphic(evt.coordinates);
    //         });

    //         // 绘制点完成事件
    //         // Create a point when user clicks on the view or presses "C" key.
    //         action.on("draw-complete", function(evt) {
    //           createPointGraphic(evt.coordinates);
    //           var point = {
    //             type: "point", // autocasts as /Point
    //             x: evt.coordinates[0],
    //             y: evt.coordinates[1],
    //             spatialReference: view.spatialReference
    //           };
    //           queryGraphic(point);
    //         });
    //       }
    //     } else if ($(this).context.title == "拉框查询") {
    //       if (draw != null) {
    //         if (graphicslayer != null && iCount != null) {
    //           clearInterval(iCount);
    //           graphicslayer.removeAll();
    //           graphicslayer.refresh();
    //           graphicslayer = null;
    //         }
    //         if ($(".layercotain").length == 0) {
    //           getfeaturelayer();
    //         } else {
    //           $(".layercotain").show(300);
    //         }
    //         var freeaction = draw.create("rectangle");
    //         freeaction.on("vertex-add", createRectGraphic);
    //         freeaction.on("cursor-update", createRectGraphic);
    //         freeaction.on("vertex-remove", createRectGraphic);
    //         freeaction.on("draw-complete", createRectGraphic);
    //       }
    //     } else if ($(this).context.title == "添加要素") {
    //       if (draw != null) {
    //         if (graphicslayer != null && iCount != null) {
    //           clearInterval(iCount);
    //           graphicslayer.removeAll();
    //           graphicslayer.refresh();
    //           graphicslayer = null;
    //         }
    //         if ($(".layercotain").length == 0) {
    //           getfeaturelayer();
    //         } else {
    //           $(".layercotain").show(300);
    //         }
    //         var queryURL = $(
    //           ".layercotain ul li input[type='radio']:checked"
    //         ).val();
    //         var featurelayer = null;
    //         if (queryURL != null) {
    //           featurelayer = new FeatureLayer({
    //             url: queryURL //MapURL + "/" + queryLayerIndex//图层地址
    //           });
    //         } else {
    //           alert("至少选择一个图层查询");
    //           return;
    //         }
    //         featurelayer.queryFeatures().then(function(result) {
    //           addDraw(result.geometryType);
    //         });
    //       }
    //     } else if ($(this).context.title == "初始化") {
    //       view.graphics.removeAll();
    //       $("#divShowResult")[0].innerHTML = "";
    //       if (graphicslayer != null && iCount != null) {
    //         clearInterval(iCount);
    //         graphicslayer.removeAll();
    //         graphicslayer.refresh();
    //         graphicslayer = null;
    //       }
    //     }
    //   });
    // *******************************************
    // 查询结果表格展开与隐藏的单击事件监听
    // *******************************************
    $("#showbtn").bind("click", function() {
      $("#divShowResult").toggle(100, resizemap);
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
        //view.graphics.removeAll();
        var graphic = queryfeatures[+$(this)[0].childNodes[0].innerText - 1];
        //view.graphics.removeAll();
        //view.graphics.items[+$(this)[0].childNodes[0].innerText - 1].visible=false;

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
        // var gotocenter=null;
        // var outSpatialReference =new SpatialReference({
        //   wkid: 4326 //PE_GCS_ED_1950
        // });

        // if(geometry.type=="point"||geometry.type=="mulitpoint"){
        //   gotocenter = projection.project([geometry.x,geometry.y], outSpatialReference);
        //   //gotocenter=[projectedPoints.x,projectedPoints.y];
        // }
        // else if(geometry.type=="polyline "){
        //   gotocenter= projection.project([(geometry.extent.xmin+geometry.extent.xmax)/2,(geometry.extent.ymin+geometry.extent.ymax)/2], outSpatialReference);
        //   //gotocenter=[(projectedPoints.extent.xmin+projectedPoints.extent.xmax)/2,(projectedPoints.extent.ymin+projectedPoints.extent.ymax)/2];
        // }
        // else{
        //   gotocenter=projection.project([geometry.centroid.x, geometry.centroid.y],geometry.spatialReference,outSpatialReference);
        // }
        // go to point at LOD 15 with custom duration
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
          //graphicslayer.refresh();
        }, 500);
      }
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
              "td span"
            )[i].currentStyle
              ? $(obj.currentTarget).find("td span")[i].currentStyle
              : window.getComputedStyle(
                  $(obj.currentTarget).find("td span")[i],
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
            .css("display", "inline-block");
          $(obj.currentTarget)
            .find("td")
            .find("span")
            .css("display", "none");
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
