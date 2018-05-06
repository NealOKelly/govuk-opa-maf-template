if (!window.Log) {
    window.Log = {
        info : function (message) {
            adf.mf.log.Application.logp(adf.mf.log.level.INFO, "Interview.js", "", message);
        },
        warning : function (message) {
            adf.mf.log.Application.logp(adf.mf.log.level.WARNING, "Interview.js", "", message);
        },
        severe : function (message) {
            adf.mf.log.Application.logp(adf.mf.log.level.SEVERE, "Interview.js", "", message);
        }
    };
}

Log.info("Loading feature-loader.js");

//Feature loading
//jQuery(function () {
//    Log.info("DOM ready");
//    document.addEventListener("deviceready", featureReady, false);
//});

//Feature ready
//function featureReady() {
//    Log.info("Feature ready");
//}

setActiveInstance = function (control, parentId) {
    $("#instanceTabs-" + parentId + " li").removeClass("active");
    $(control).parent().addClass("active");
    $("#instanceViews-" + parentId + "> .entity-instance-group").removeClass("active");
    $("#instanceViews-" + parentId + "> #view" + control.id).addClass("active");
};

saveContact = function () {
    var name = $("input[name='qs%2404b5945f-4462-438e-85c3-bd75fc6cf518%24global%24global1']").val();
    var number = $("input[name='qs%2404b5945f-4462-438e-85c3-bd75fc6cf518%24global%24global2']").val();
    var contact = navigator.contacts.create( {
        "displayName" : name
    });
    // store contact phone numbers in ContactField[]
    var phoneNumbers = [];
    phoneNumbers[0] = new ContactField('work', number, true);
    contact.phoneNumbers = phoneNumbers;

    contact.save();
    $(".cd-form-buttons").prepend("<div style=\"font-weight: 900; font-family: menufontB; color:green;\">" + name + " saved to contacts.</div><br/>");
};

removeAttachedPicture = function (attachmentId) {
    var div = $(document.getElementById("existing_image_" + attachmentId));

    var input = div.find("input");
    input.attr("value", "1");
    div.hide();
};

removeUnattachedPicture = function (controlId) {
    var element = document.getElementById(controlId);
    element.parentNode.removeChild(element);
};

getPicture = function (controlId, useCamera) {
    var parentDiv = document.getElementById("new_images_" + controlId);
    var parentBoundingRect = parentDiv.getBoundingClientRect();

    var imageSourceType = navigator.camera.PictureSourceType.PHOTOLIBRARY
    if (useCamera) {
        imageSourceType = navigator.camera.PictureSourceType.CAMERA;
    }
    
    var cameraPopoverOptions = new CameraPopoverOptions(parentBoundingRect.left, parentBoundingRect.top, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY);
    
    navigator.camera.getPicture(onSuccess, onError,
    {
        quality : 100,
        sourceType : imageSourceType,
        popoverOptions : cameraPopoverOptions,
        targetWidth: 1000,
        targetHeight: 1000
    });

    function onSuccess(imageURI) {   
    
        // copy file to new location to avoid downscaled gallery images being overwritten by subsequent selections from the gallery
        try {
            adf.mf.el.invoke( "#{applicationScope.august2016Interview.copyCapturedImage}", [imageURI], "java.lang.String", ["java.lang.String"],
                function success(request, copiedImageURI) {
                    // get the guid out of the new file name
                    var tokens = copiedImageURI.split("/");
                    var copiedFileName = tokens[tokens.length - 1];
                    var guid = copiedFileName.split(".")[0];
                
                    var imageDiv = document.createElement("div");
                    imageDiv.id = "new_image_" + controlId + "_" + guid;
                    imageDiv.className = "new-image-attachment";
                    imageDiv.cssText = "display:inline-block";
                    
                    var image = document.createElement("img");
                    image.style.cssText = "max-height:70px;max-width:140px";
                    image.src = copiedImageURI;
                    image.className = "new_image_file";
                    
                    
                    removeHyperlink = document.createElement("a");
                    removeHyperlink.onclick = function() { removeUnattachedPicture(imageDiv.id); return false;}
                    removeHyperlink.className = "linkRemoveUploadedImage"
                    
                    imageDiv.appendChild(image)
                    imageDiv.appendChild(removeHyperlink);
                    parentDiv.appendChild(imageDiv);
                },
                function fail() {
                    Log.severe("INVOCATION ERROR");
                    
                }
            );
        } catch (err) {
            Log.severe("CORDOVA ERROR");
        }
    }

    function onError(message) {
        //alert('Failed: ' + message);
    }

    function getFilename(url) {
        if (url) {
            var m = url.toString().match(/.*\/(.+?)\./);
            if (m && m.length > 1) {
                return m[1];
            }
        }
        return "";
    }
};

populateCoordinates = function (latControlId, lonControlId) {
    var latInput = document.getElementById(latControlId);
    var lonInput = document.getElementById(lonControlId);
    latInput.value = "Searching...";
    lonInput.value = "Searching...";
    navigator.geolocation.getCurrentPosition(onSuccess, onError);

    function onSuccess(position) {
        latInput.value = position.coords.latitude
        lonInput.value = position.coords.longitude;
    }

    function onError(message) {
        latInput.value = "GPS Error";
        lonInput.value = "GPS Error";
    }
};

clearCoordinates = function (latControlId, lonControlId) {
    var latInput = document.getElementById(latControlId);
    var lonInput = document.getElementById(lonControlId);
    latInput.value = "";
    lonInput.value = "";
};

toggleSidebar = function () {
    $('#interviewWrapper').removeClass('startOpen');
    $('#interviewWrapper').toggleClass('sidebarOpen');
    return false;
};

clearDrawnSignature = function (sigPadId) {
    var sigPadElem = $(document.getElementById(sigPadId));
    
    // Remove any previously drawn signature
    var existingSignatureDiv = sigPadElem.parent().find(".existing-image-attachment");
    var existingSignatureInput = existingSignatureDiv.find("input");
    existingSignatureInput.attr("value", "1");
    existingSignatureDiv.hide();

    // Clear the canvas
    $(sigPadElem).signaturePad().clearCanvas();
    
    // Show the signature pad
    $(sigPadElem).show();    
}

processSignature = function(currentSignatureId) {
    function success(request, newFileID) {              
        var span = document.createElement("span");
        span.className = "new_signature"
        span.style.cssText = "display:none";
        var content = document.createTextNode(newFileID);
        span.appendChild(content);
                                                               
        var parentDiv = document.getElementById("new_signature_wrapper_" + controlId);
        $(parentDiv).empty();
        parentDiv.appendChild(span);
    }
    
    function failed(request, response) {
        Log.severe("Writing signature to image failed");
    }
    
    var base64EncodedPng = $(document.getElementById(currentSignatureId)).signaturePad().getSignatureImage();
    
    var controlId = currentSignatureId.replace("signature_", "");
    adf.mf.api.invokeMethod("com.oracle.determinations.mobile.pages.August2016InterviewPage", "handleBase64EncodedSignatureFile", base64EncodedPng, controlId, success, failed)
}