var actualUrlImg="";
var MAX_NUM_TRIES = 10; // after 10 consecutive errors we will stop showing images
var loop;
var imgPort="8081";

var quality=50;
var widthCamera=320;
var heightCamera=240;


var defaultImg;//="http://"+ipLocal+":"+imgPort+"/stream?topic=/stereo/right/image_raw?quality="+quality+"?width="+widthCamera+"?height="+heightCamera;

var recognizeObjImg;// = "http://"+ipLocal+":"+imgPort+"/stream?topic=/qbo_stereo_selector/viewer?quality="+quality+"?width="+widthCamera+"?height="+heightCamera;

var recognizeFaceImg;// = "http://"+ipLocal+":"+imgPort+"/stream?topic=/qbo_face_tracking/viewer?quality="+quality+"?width="+widthCamera+"?height="+heightCamera;


var fps=24;

var ctx;
var img = new Image();
var canvas;

var ctxQboVision;
var canvasQboVision;

var action;
var countdown;
var bool_drawing=false;
var recording = false;
var watching = false;
var training = false;
var auxTime4Coundown;

var name2Learn;

var objectORface="object";


var msgWebCamWatching = "Watching";
var msgWebCamTraining = "Training...";
var msgWebCam = "";
var msgWebCamRec = "Rec";

var timeout4Message;

function startEverything(){

        //Camera settings
        //Inicializacion de vriables para refreshWebCam
        canvas = document.getElementById('canvasWebcam');
        ctx=canvas.getContext('2d');


		//Getting images
		output = {image:"live_leftEye", quality: quality, width: widthCamera, height: heightCamera};
	    jQuery.post('/mjpegServer/getUrlFrom',output,function(data) {
				//getDefaultImg = "http://"+ipLocal+":"+imgPort+data;
				defaultImg = data;
                actualUrlImg = data;
                jQuery("#qboVision").attr("src",getDefaultImg);                
	    });

		output = {image:"live_objects", quality: quality, width: widthCamera, height:heightCamera};
	    jQuery.post('/mjpegServer/getUrlFrom',output,function(data) {
	            //getRecognizeObjImg = "http://"+ipLocal+":"+imgPort+data;
	            recognizeObjImg = data;
        });

		output = {image:"live_faces", quality: quality, width: widthCamera, height:heightCamera};
	    jQuery.post('/mjpegServer/getUrlFrom',output,function(data) {
                recognizeFaceImg = data;
	    });


//		loop=setInterval("refreshWebCam();",fps);


        jQuery("#training").click(function(){
            jQuery("#input").show();
        });

		jQuery("#ok_start_training").click(function(){
			name2Learn =  jQuery("#face_object_name").val().toUpperCase();		
			if(name2Learn==""){
                showMessage("${language['error_no_name_written']}");
			}else{

				 //launch Nodes
        	     jQuery.post('/training/launchNodes',function(data) {	
					       if(objectORface == "object"){

                                       if( actualUrlImg.indexOf(recognizeObjImg) != -1 ){   
                                            stopCmd = img.src.replace("stream","stop");
                                            jQuery.get(stopCmd);                            
                                       }
                                       jQuery("#qboVision").attr("src",getRecognizeObjImg());
                                       actualUrlImg=getRecognizeObjImg();
        	        		       }else{
                                       if( actualUrlImg.indexOf(recognizeFaceImg) != -1 ){
                                            stopCmd = img.src.replace("stream","stop");
                                            jQuery.get(stopCmd);
                                       }
                                       jQuery("#qboVision").attr("src",getRecognizeFaceImg());
                                       actualUrlImg=getRecognizeFaceImg();
        		        	       }
	        		               auxTime4Coundown = new Date().getTime();
	                		       action="learning";
        		        	       countdown=3;
                                   bool_drawing=true;
			                       loop=setInterval('drawInfoinCanvas();',1000);
					
				});
			}
		});

        jQuery("#guessing").click(function(){
			//launch Nodes
			jQuery.post('/training/launchNodes',function(data) {
				if(objectORface == "object"){

                    if( actualUrlImg.indexOf(recognizeObjImg) != -1 ){
                        stopCmd = jQuery("#qboVision").attr("src").replace("stream","stop");
                        jQuery.get(stopCmd);
                    }
					jQuery("#qboVision").attr("src",getRecognizeObjImg());
                    actualUrlImg=getRecognizeObjImg();
				}else{
                    if( actualUrlImg.indexOf(recognizeFaceImg) != -1 ){
                        stopCmd =  jQuery("#qboVision").attr("src").replace("stream","stop");
                        jQuery.get(stopCmd);
                    }   

					jQuery("#qboVision").attr("src",getRecognizeFaceImg());
                    actualUrlImg=getRecognizeFaceImg();
				}
                auxTime4Coundown = new Date().getTime();
                action="recognizing";
                countdown=3;
                bool_drawing=true;
                loop=setInterval('drawInfoinCanvas()',1000); 
            });
		});

		jQuery("#radioFace").click(function(){
            
			jQuery.post('/training/selectFaceRecognition',function(data) {
                   
				jQuery("#personORobject").html("person");
                objectORface = "face";
			});	

		});

		jQuery("#radioObject").click(function(){
			jQuery.post('/training/selectObjectRecognition',function(data) {
				jQuery("#personORobject").html("object");
                objectORface = "object";
			});	

		});


}

function drawInfoinCanvas(){

        
        try{
            if(bool_drawing){
                        //Painting countdown
                        if(countdown > -1){

                                if ( new Date().getTime() - auxTime4Coundown >= 1000 ){
                                        countdown = countdown - 1;
                                        auxTime4Coundown = new Date().getTime();
                                }
                                if(countdown != -1){
                                        ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );
                                        ctx.font = "bold 36px sans-serif";
                                        ctx.fillStyle = "rgb(255, 0, 0)";
                                        ctx.fillText(countdown.toString(), 10, 200);

                                }else{
                                        countdown = -100;
                                        //alert("lanzadera");
                                        //Lanzamos la grabacion de fotogramas                           
                                        //ID_grabaFotogramas = setInterval(grabaFotogramas, delayBtwFotogramsCaptured);

                                        if(action=="learning"){
                                                recording=true;
                                                disableRadioBotton(true);
                                                startLearning();
                                        }else if(action=="recognizing"){
                                                watching=true;
                                                disableRadioBotton(true);
                                                startRecognition();
                                        }

                                }

                        }

                        if(recording && countdown==-100){
                                ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );
                                ctx.font = "bold 36px sans-serif";
                                ctx.fillStyle = "rgb(255, 0, 0)";
                                ctx.fillText(msgWebCamRec, 10, 200);
                        }else if(training && countdown==-100){
                                ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );
                                ctx.font = "bold 36px sans-serif";
                                ctx.fillStyle = "rgb(255, 0, 0)";
                                ctx.fillText(msgWebCamTraining, 10, 200);
                        }else if(watching && countdown==-100){
                                ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );
                                ctx.font = "bold 36px sans-serif";
                                ctx.fillStyle = "rgb(255, 0, 0)";
                                ctx.fillText(msgWebCamWatching, 10, 200);
                        }

            }else{
                ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );
                clearInterval(loop);
            }

        }catch(e){
            ctx.clearRect ( 0 , 0 , canvas.width , canvas.height );
            clearInterval(loop);
        }


}


function startLearning(){
    //lanzamos aprendizaje
    output = { objectName : name2Learn };
    jQuery.post('/training/startLearning' ,output, function(data) {
        recording=false;
        training=true;
        jQuery.post('/training/startTraining' , function(data) {
            training=false;
            bool_drawing=false;

            if(data){
                showMessage("${language['learning_ok']}"+name2Learn);
            }else{//error
                showMessage("${language['learning_ko']}"+name2Learn); 
            }

            jQuery("#input").hide();

            //We back to normal image
            stopCmd = jQuery("#qboVision").attr("src").replace("stream","stop");
            jQuery.get(stopCmd);

            jQuery("#qboVision").attr("src",getDefaultImg());            
            actualUrlImg=getDefaultImg();
            $.post('/training/stopNode',function(data) {

            });
        });
    });
}


function startRecognition(){
	 //start recognition
    jQuery.post('/training/startRecognition',function(data) {
        actualUrlImg=getDefaultImg();
        watching=false;
        bool_drawing=false;

        if(data!=""){
            showMessage("${language['this_is_a']}"+data.toLowerCase());
        }else{
            showMessage("${language['dontKnow']}");
        }

        //paramos nodo
        jQuery.post('/training/stopNode',function(data) {
        });

        jQuery("#input").hide();

        //We back to normal image
        stopCmd = jQuery("#qboVision").attr("src").replace("stream","stop");
        jQuery.get(stopCmd);            


        jQuery("#qboVision").attr("src",getDefaultImg());


        actualUrlImg=getDefaultImg();
        disableRadioBotton(false);

        })
        .error(function() {
            //paramos nodo
            jQuery.post('training/stopNode',function(data) {
        });


        //We back to normal image
        stopCmd = jQuery("#qboVision").attr("src").replace("stream","stop");
        jQuery.get(stopCmd);
        
        jQuery("#qboVision").attr("src",getDefaultImg());
        actualUrlImg=getDefaultImg();
        disableRadioBotton(false);
        });
       }









function disableRadioBotton(disable){

	if(disable){
	jQuery("#radio").attr("disabled", "disabled");
	}else{
		jQuery("#radio").removeAttr("disabled");
	}	
}






function showMessage(text){

    try{
        cleatTimeout(timeout4Message);
    }catch(e){}

    jQuery("#divQboMessage").show();    

    //We set the position for the error "dialog", where an avatar of qbo appears and says something
    positionCanvas = jQuery("#divQboVision").offset();

    jQuery("#divQboMessage").offset({ top: positionCanvas.top+jQuery("#divQboVision").height()-jQuery("#qboAvatar").height(),
                                      left: positionCanvas.left+jQuery("#divQboVision").width()+20   });

    jQuery("#divQboMessage").hide();
    jQuery("#divQboMessage").fadeIn();

    jQuery("#errorText").html(text)

    timeout4Message = setTimeout('jQuery("#divQboMessage").fadeOut()',3000);

}


function getRecognizeObjImg(){
    t=new Date().getTime();
    return recognizeObjImg+"&t="+t;
}
function getRecognizeFaceImg(){
    t=new Date().getTime();
    return recognizeFaceImg+"&t="+t;
}
function getDefaultImg(){
    t=new Date().getTime();
    return defaultImg+"&t="+t;
}
