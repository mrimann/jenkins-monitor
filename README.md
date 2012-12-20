Jenkins Monitor
=============

A project aims at helping you show status of build in blue(building), red(failure), green(success) box on jenkins.
By using jquery jsonp support and jenkins built-in jsonp reponse support, implementing this is just a piece of cake.

Why
-------

It's very important to radiate build status on jenkins (passively). So that everybody in the team can just raise your head
a little bit and take a look at the builds on screen(it could be in big TV),whether it is red/blue/green. Also it borrows very similar metaphor from Test Driven Development rhythm. Red color box means that build is failed, someonebody in the team may need to take a look at it; Green means "yep, success"; Blue means that build currently is building; Grey means that build is aborted or disabled.

The initial screen that [tuo](https://github.com/tuo) has created looked like this:

![Prototype](http://farm7.static.flickr.com/6037/6328931162_042f2c1d09_z.jpg "Optional title")

Meanwile, we at [internezzo](http://www.internezzo.ch/) have played around and added the one or other feature so that our screen now looks completely different - but supports our developers a bit more.

In case all builds were ok, the screen looks like the following screenshot and shows a list of the latest built jobs on the left (chronologically) and some "statistics" on the right side:

![In case all is fine](https://raw.github.com/laeuft/jenkins-monitor/master/img/demo_all_green.png "Screenshot from our radiator screen")

If there's a job failing, it's shown very prominent on the top of the screen and pulsates to get even more attention.

![If a job failed](https://raw.github.com/laeuft/jenkins-monitor/master/img/demo_failed_job.png "Screenshot from our radiator screen")


How to Use
-----------

    git clone git://github.com/tuo/jenkins-monitor.git


  Then copy or rename conf/config.js.sample to conf/config.js:

    copy conf/config.js.sample conf/config.js

  or

    mv conf/config.js.sample conf/config.js

	And open conf/config.js to change your jenkins ci address and jobs name you want to show on dashboard like following:

		var ci_url = "http://ci.jruby.org/view/Ruboto";
		var jobs_to_be_filtered = ["apitest", "ergonomics"];


  Then run from command line:

		open dashboard.html -a safari


Contribute
------------
This project is still working in progress.
Suggestions? Email to: clarkhtse@gmail.com



Thanks to Hylke Bons for creating and sharing his iconset "Discovery"! http://hbons.deviantart.com/art/Discovery-Icon-Theme-77399781