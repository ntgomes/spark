## Troubleshooting 

Having issues with something in Spark? Here is a list of commonly found problems and potential solutions: 

__Launching Screen Share__: When accessing the software, I am not able to screen share. 

Recreating Problem: 
- I open the software and log into a particular room. 
- I can interact with my camera/mic/gesture buttons and see the console.log change. 
- However, I cannot interact with my screen sharing capabilities.

Solutions: 
- Check to make sure there is another participant in the call. If only one user is connected, screen sharing functionality is not available. 
- When you do screen share, it is expected that your screen share view will replace your video view when sent to the other user. 

__Microphone/Camera Button Not Working__: The mic/camera button will not allow me to click it. 

Recreating Problem: 
- I open the software and log into a particular room. 
- I can interact with my screen sharing button. 
- I cannot interact with my camera/mic button. 

Solutions: 
- Check to see if the settings for the browser you are in are allowing microphone/camera connections. Enable them and it should work. Sometimes if the connection is disabled globally, it will not work within the app. You may also be able to change this access in the upper right hand side of the search bar for the browser. 
- Try refreshing the page or rejoining the room, maybe in an incognitio/private window. 
- Still not working? Check the console logs to see if there is issues accessing the media devices. 

__Gestures not working__:  

Tips and Tricks
- For thumbs up/down, try using your left hand for the signalling. It works best if you keep your hand within 2 feet of the screen with a blank background behind you. 
- For screen share (swiping left/right), try using your left middle and index finger. Point them directly at the screen, one above the other, and move at an even pace to the right to start (or left to end) the screen share. 
- Still not being recognized? Use chrome, launch the software and open up the developers tools. Try your gestures now. You should see the console logging which gestures are being recognized. Once you get the hang of it, you should be able to control the movements much more easily!

__Website Documentation Not Comprehensive__: 

Accessing the [documentation website](https://ntgomes.github.io/spark/) with full function documentation but missing the home page contents? You may be seeing an older version of the website, or are viewing the website contents locally. Or you may have deleted/overwritten the index.html file by running the generate-documentation script. 

Locally, run the following command on the latest main branch of this repo:

```
# either use 
$ npm run doc 

# or 
$ npm run generate-docs
```
