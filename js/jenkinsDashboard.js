/*jslint browser:true, sloppy: true, plusplus: true */
/*globals $: false, config: false */

var dashboardLastUpdatedTime = new Date();

var jenkinsDashboard = {
	addTimestampToBuild : function (elements) {
		elements.each(function () {
			var worker = $(this).attr("class"),
				y = parseInt($(this).offset().top + $(this).height() / 2),
				x = parseInt($(this).offset().left + $(this).width() / 2),
				id = x + "-" + y,
				html = '<div class="job_disabled_or_aborted" id="' + id + '">' + worker + '</div>',
				new_element;
			$("#left").append(html);
			new_element = $("#" + id);
			new_element.css("top", parseInt(y - new_element.height() / 2)).css("left", parseInt(x - new_element.width() / 2));
			new_element.addClass('rotate');
			$(this).addClass('workon');
		});
	},
	composeHtmlFragement: function (jobs) {
		jobs = this.getJobsOrderedByLastBuild(jobs);
		var fragment = "<section>",
			jobs_to_be_filtered = config.jobs_to_be_filtered,
			jobs_to_be_excluded = config.jobs_to_be_excluded;
		$.each(jobs, function () {
			if ((jobs_to_be_filtered.length === 0 || $.inArray(this.name, jobs_to_be_filtered) !== -1) && ($.inArray(this.name, jobs_to_be_excluded) === -1)) {
				// calculate health report average
				healthReportSum = 0;
				if (this.healthReport != undefined) {
					for(var i = 0; i < this.healthReport.length; i++) {
						healthReportSum += parseInt(this.healthReport[i].score);
					}
					this.health = healthReportSum/this.healthReport.length;

					// find health level for health value
					if (this.health > 80) {
						this.health = '80plus';
					} else if (this.health >= 60) {
						this.health = '60plus';
					} else if (this.health > 40) {
						this.health = '40plus';
					} else if (this.health > 20) {
						this.health = '20plus';
					} else {
						this.health = '0plus';
					}
				}
				fragment += ('<article class="' + this.color + ' health' + this.health + '"><head>' + this.name + '</head></article>');
			}
		}
	),

		// output all the projects to the list
		fragment += '</section>';
		$('#left').html(fragment);

		// add last update timestamp to the output
		dashboardLastUpdatedTime = new Date();
		timestampFragment = "<article class='time'>" + dashboardLastUpdatedTime.toString('dd, MMMM ,yyyy')  + "</article>";
		$("#content #time").html(timestampFragment);
	},

	outputLatestBuildTime: function (jobs) {
		orderedJobs = this.getJobsOrderedByLastBuild(jobs);
		var lastBuildTimestamp = Math.round(orderedJobs[0].lastBuild.timestamp / 1000);
		var nowTimestamp = Math.round(new Date().getTime() / 1000) ;
		var minutesSinceLastBuild = Math.round((nowTimestamp - lastBuildTimestamp) / 60);
		$('#lastBuildTime span').html(minutesSinceLastBuild + 'min');
	},

	outputBestRatedJobs: function (jobs) {
		orderedJobs = this.getJobsOrderedByHealthRating(jobs);
		var fragment = '';
		for (i = 0; i < 3; i++) {
			job = orderedJobs[i];
			fragment += '<article class="' + job.color + ' health' + this.health + '"><head>' + job.name + '</head></article>';
		}
		$('#highestRated section').html(fragment);
	},

	outputLowestRatedJobs: function (jobs) {
		orderedJobs = this.getJobsOrderedByHealthRating(jobs);
		var fragment = '';
		for (i = 0; i < 3; i++) {
			job = orderedJobs[orderedJobs.length-i-1];
			fragment += '<article class="' + job.color + ' health' + this.health + '"><head>' + job.name + '</head></article>';
		}
		$('#lowestRated section').html(fragment);
	},

	updateBuildStatus : function (data) {
		jenkinsDashboard.composeHtmlFragement(data.jobs);
		jenkinsDashboard.outputLatestBuildTime(data.jobs);
		jenkinsDashboard.outputBestRatedJobs(data.jobs);
		jenkinsDashboard.outputLowestRatedJobs(data.jobs);
		jenkinsDashboard.addTimestampToBuild($(".disabled, .aborted"));
	},


	// helper methods

	getJobsOrderedByLastBuild: function(jobs) {
		jobs.sort(function(a, b) {
			// in case we have not a single build yet (new project), fix that
			if (a.lastBuild == null) {
				a.color = 'grey';
				a.lastBuild = new Array();
				a.lastBuild.timestamp = Math.round((new Date()).getTime() / 1000);
			}
			if (b.lastBuild == null) {
				b.color = 'grey';
				b.lastBuild = new Array();
				b.lastBuild.timestamp = Math.round((new Date()).getTime() / 1000);
			}

			if (a.lastBuild.timestamp < b.lastBuild.timestamp) {
				return 1;
			}
			if (a.lastBuild.timestamp > b.lastBuild.timestamp) {
				return -1;
			}
			if (a.lastBuild.timestamp == b.lastBuild.timestamp) {
				return 0;
			}
		})
		return jobs;
	},

	getJobsOrderedByHealthRating: function(jobs) {
		for(var i = 0; i < jobs.length; i++) {
			// calculate health report average
			healthReportSum = 0;
			for(var j = 0; j < jobs[i].healthReport.length; j++) {
				healthReportSum += parseInt(jobs[i].healthReport[j].score);
			}
			jobs[i].health = healthReportSum/jobs[i].healthReport.length;

		}

		jobs.sort(function(a, b) {
			if (a.health < b.health) {
				return 1;
			}
			if (a.health > b.health) {
				return -1;
			}
			if (a.health == b.health) {
				return 0;
			}
		})

		return jobs;
	}

};

$(document).ready(function () {

	var ci_url = config.ci_url + "/api/json?tree=jobs[name,color,healthReport[score],lastBuild[timestamp]]",
		counter = 0,
		auto_refresh = setInterval(function () {
			counter++;
			$.jsonp({
				url: ci_url + "&format=json&jsonp=?",
				dataType: "jsonp",
				// callbackParameter: "jsonp",
				timeout: 10000,
				beforeSend: function (xhr) {
					if (counter === 1) {
						$.blockUI({
							message: '<h1 id="loading"><img src="img/busy.gif" />loading.....</h1>'
						});
					}
				},
				success: function (data, status) {
					$.unblockUI();
					jenkinsDashboard.updateBuildStatus(data);
				},
				error: function (XHR, textStatus, errorThrown) {
					if ($("#error_loading").length <= 0) {
						$.blockUI({
							message: '<h1 id="error_loading"> Ooooops, check out your network etc. Retrying........</h1>'
						});
					}
				}
			});
		}, 4000);
});