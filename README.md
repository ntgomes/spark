<h3 align="center">
  
  <img src="/docs/documentation_photos/project_name.jpg" alt="drawing" width="450"/>    

  <a href="README.md">Overview</a>     |     <a href="INSTALL.md">Installation</a>    |       <a href="/docs/project_roadmap.md">Long Term Objectives</a>    
 
[![Build](https://github.com/ntgomes/spark/actions/workflows/build.yml/badge.svg)](https://github.com/ntgomes/spark/actions/workflows/build.yml)
[![Lint](https://github.com/ntgomes/spark/actions/workflows/lint.yml/badge.svg)](https://github.com/ntgomes/spark/actions/workflows/lint.yml)
[![Test](https://github.com/ntgomes/spark/actions/workflows/test.yml/badge.svg)](https://github.com/ntgomes/spark/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/ntgomes/6867c01dee2f4d0f96d052c2b2e74ccf/raw/coverage.json)](https://github.com/ntgomes/spark/blob/main/docs/results.md#code-coverage)
[![DOI](https://zenodo.org/badge/556983678.svg)](https://zenodo.org/badge/latestdoi/556983678)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  
</h3>

We have the best hands free solution to your presentation needs! Have you ever presented to an audience and not had the ability to interact and change your meeting controls on the go? Spark is a solution to use gestures to change your volume and screen sharing settings while you present. You no longer need to type a value, instead just give your camera a gesture and keep on presenting. We guarantee it will *spark* new conversations and be the most seemless, hands-free presentation you have had! 

## Capabilities 

- Allows a virtually unlimited number of users to join a room as a video conferencing web application
- Gives each user camera and microphone controls through buttons that toggle their respective video and audio
- Allows users in the same room to send share text messages using the chat window section 
- Lets users share any file from their system by using a file transfer button
- Allows for anyone to share their screen to others in the same room
- Distinguishes hosts and non-hosts in a room, with special actions being allowed by the host of the room
    - Access to a mute all button which mutes everyone in the room
    - Access to set a number of breakout rooms, and send other room members to those breakout rooms equally 
- Provides utilities for user to be able to use gestures to manipulate the web conferencing interface
    - Show a thumbs up __to change volume__ 
    - Swipe left or right to interact with your __screen sharing capabilities__. 

<h1 align="center"> 

<img src="/docs/documentation_photos/swipe.jpeg" alt="drawing" width="300" height="200"/>    
<img src="/docs/documentation_photos/thumbs-up-thumbs-down.gif" width="300" height="200"/>   

</h1>

## Demo Video 

<h1 align="center"> 

![Spark Demo](https://user-images.githubusercontent.com/99683342/194715093-3fbc1bc9-7690-4edb-b8bb-5594ba029bb7.mp4) 

<h1>

## Worked Examples

1. User is directed to the homepage where they are asked to enter a room number they would like to join. If the room does not already exist, a new room will be created for the user, for example, Room 2 is created in our case here.

<img src="/docs/documentation_photos/ChooseRoomNo.png" alt="drawing" width="480" /> 

2. If another person wishes to join the room, they can simply enter the same room number to join the room. Currently, the application supports volume functions for mute/ unmute, video on/off, and screen share functionality. Gesture recognition is enabled by default for the mute/unmute and screen sharing functionalities.

<img src="/docs/documentation_photos/RoomWithOne.png" alt="drawing" width="480" /> 

3. By showing thumbs up/ down action towards the camera, either of the two users will be able to mute/ unmute their microphones. Similarly swipe left/ right action towards the camera will allow the users to share their screens with each other. In addition, users will also be able to disable gesture recognition by clicking the <b>Disable Gestures<b> button.

<img src="/docs/documentation_photos/MeetingWithTwo.png" alt="drawing" width="480" /> 

<img src="/docs/documentation_photos/ScreenSharing.png" alt="drawing" width="480" /> 

## Use 

Setup and installation instructions can be found in the [user-friendly install guide](INSTALL.md)

## Testing / Coverage

Visit our [results page](/docs/results.md) for more information regarding running our test and code coverage scripts. 

## How Does it Work?

See our [high-level diagrams](/docs/diagrams.md) for visual representations and flows for all how the source files are needed to make Spark work as it does. 

## Directory Structure 

Visit our [file tree structure](/docs/filetree.txt) for more information on how Spark's codebase is structured.

## Contributing

Are you interested in contributing to this project? Visit our [contribution documentation](CONTRIBUTING.md) to learn more. 
  
Need some ideas on what to contribute? Visit our [project roadmap](/docs/project_roadmap.md) to get some ideas or jump on over to our [development project board](https://github.com/users/SiddarthR56/projects/1) for specific issues we are tracking. 

This project is made possible by the incredible donation of time from NC State Project Contributors and the advice/support of CSC 510 teaching staff. NC State University has made the resources for this project possible, and will continue to support CSC 510 projects for the forseeable future. 

## Help 

View some common issues users have identified in our [troubleshooting guide](https://github.com/ntgomes/spark/blob/main/docs/troubleshooting_guide.md). We list tips and tricks for identifying where the issue may be coming from. Issue reports may be linked to this guide if you identify a bug that is a software limitation. 

You can visit our website with full descriptions of our classes and methods by go to our [documentation website](https://ntgomes.github.io/spark/) within your web browser of choice. Included on the website are user profiles of people who should use the software, as well as success stories!
  
Need more support? Our primary method for addressing bugs and feature requests should be through submitting an issue ticket in the "Issues" tab. If you need additional support, please reach out to our development email develop.nak@gmail.com and a member of the team will be in contact with you shortly. You can also email the development email to asked to be added to our subsriber list for updates regarding the project's development.

