var express = require("express");
var app = express();
var http = require("http").createServer(app);
var mongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectId;
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt");
const { request } = require("http");
const { getVideoDurationInSeconds } = require('get-video-duration');
var formidable = require("formidable");
var fileSystem = require("fs");



app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

app.use(bodyParser.json( { limit: "10000mb" } ));
app.use(bodyParser.urlencoded( { 
    extended: true, limit: "10000mb", parameterLimit: 1000000 } ));


var hostname="0.0.0.0";
var port=3000;

http.listen(port,hostname, function () {
	console.log(`Server started at http://${hostname}:${port}`);
	mongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true }, function (error, client) {
database=client.db("my_video_streaming");

app.get("/", function (request, result) {

    database.collection("videos").find({}).sort(
        {"createdAt": -1}).toArray(function (error1, videos) {
        result.render("index", {
            "videos": videos,
            "url": request.url
        });
    });
});

app.get('/upload',(req,res)=>{
    res.render("upload");
});


app.post("/upload-video", function (request, result) {

          var formData = new formidable.IncomingForm();
        formData.maxFileSize = 1000 * 1024 * 1204;
        formData.parse(request, function (error1, fields, files) {
            var oldPath = files.video.path;
            var newPath = "public/videos/" + new Date().getTime() + "-" + files.video.name;

            var title = fields.title;
            var description = fields.description;
            var tags = fields.tags;
            var videoId = fields.videoId;
            var thumbnail = fields.thumbnailPath;

            var oldPathThumbnail = files.thumbnail.path;
            var thumbnail = "public/thumbnails/" + new Date().getTime() + "-" + files.thumbnail.name;

            fileSystem.rename(oldPathThumbnail, thumbnail, function (error2) {
                console.log("thumbnail upload error = ", error2);
            });

            fileSystem.rename(oldPath, newPath, function (error2) {
               
                    var currentTime = new Date().getTime();

                    getVideoDurationInSeconds(newPath).then((duration) => {

                        var hours = Math.floor(duration / 60 / 60);
                        var minutes = Math.floor(duration / 60) - (hours * 60);
                        var seconds = Math.floor(duration % 60);

                        database.collection("videos").insertOne({
                            // "user": {
                            //     "_id": user._id,
                            //     "first_name": user.first_name,
                            //     "last_name": user.last_name,
                            //     "image": user.image,
                            //     "subscribers": user.subscribers
                            // },
                            "filePath": newPath,
                            "createdAt": currentTime,
                            "views": 0,
                            "watch": currentTime,
                            "minutes": minutes,
                            "seconds": seconds,
                            "hours": hours,
                            "title": title,
                            "description": description,
                            "tags": tags,
                            "category": fields.category,
                            "thumbnail": thumbnail
                        }, function (error3, data) {
                            result.redirect("/");

                        });
                    });
                });
            });
        });       

        app.get('/watch/:watch',(req,res)=>{
            database.collection("videos").findOne({
                "watch":parseInt(req.params.watch)
            },
            (error,video)=>{
                if(video==null){
                    res.send("video dosnt exist");
                }else{
                    res.render('video-page/index',{ "video":video});
                }
            })
        })

});
	
	});