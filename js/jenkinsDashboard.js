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
    filterJobs: function(jobs) {
        var jobs_to_be_filtered = config.jobs_to_be_filtered,
        jobs_to_be_excluded = config.jobs_to_be_excluded;

        var filteredJobs = new Array();
        for (var x = 0; x < jobs.length; x++) {
            job = jobs[x];
            if ((jobs_to_be_filtered.length === 0 || $.inArray(job.name, jobs_to_be_filtered) !== -1) && ($.inArray(job.name, jobs_to_be_excluded) === -1)) {
                filteredJobs.push(job);
            }
        }

        return filteredJobs;
    },
	composeHtmlFragement: function (jobs) {
		var fragment = "<section>";
		var failedBuilds = '';
        jobs = this.getJobsOrderedByLastBuild(jobs);

		for (var j = 0; j < config.number_of_jobs_to_list; j++) {
			job = jobs[j];
				// calculate health report average
				healthReportSum = 0;
				if (job.healthReport != undefined) {
					for(var i = 0; i < job.healthReport.length; i++) {
						healthReportSum += parseInt(job.healthReport[i].score);
					}
					job.health = healthReportSum/job.healthReport.length;

					// find health level for health value
					if (job.health > 80) {
						job.health = '80plus';
					} else if (job.health >= 60) {
						job.health = '60plus';
					} else if (job.health > 40) {
						job.health = '40plus';
					} else if (job.health > 20) {
						job.health = '20plus';
					} else {
						job.health = '0plus';
					}
				}

				var lastBuildTimestamp = Math.round(job.lastBuild.timestamp / 1000);
				var nowTimestamp = Math.round(new Date().getTime() / 1000) ;
				var minutesSinceLastBuild = Math.round((nowTimestamp - lastBuildTimestamp) / 60);

				var jobEntry =  ('<article class="' + job.color + ' health' + job.health + '"><head>' + job.name + '</head><span class="last">' + this.formatMinutesToShortString(minutesSinceLastBuild) + '</span></article>');

				if (job.color == 'red') {
					failedBuilds += jobEntry;
				} else {
					fragment +=	jobEntry;
				}
			}

		// output the failed builds to the DIV on top or re-hide that container if all's fine
		if (failedBuilds != '') {
			$('#failedBuilds').html(failedBuilds);
			$('#failedBuilds').show();
		} else {
			$('#failedBuilds').hide().html('');
		}

		// make the failed builds stand out with some blinky action
		$('#failedBuilds article').each(function() {
			// do fading 3 times
			for(i=0;i<20;i++) {
				$(this).fadeTo('slow', 0.7).fadeTo('slow', 1.0);
			}
		});

		// output all the successfully built projects to the list
		fragment += '</section>';
		$('#left').html(fragment);

		// add last update timestamp to the output
		dashboardLastUpdatedTime = new Date();
		timestampFragment = "<article class='time'>" + dashboardLastUpdatedTime.toString('dd, MMMM ,yyyy')  + "</article>";
		$("#content #time").html(timestampFragment);
	},

	formatMinutesToString: function (minutes) {
		var timeSinceLastBuild = '';
		if (minutes < 1) {
			timeSinceLastBuild += '<span>now</span>';
		} else if (minutes <= 60) {
			timeSinceLastBuild += '<span>' + minutes + 'min</span> ago';
		} else if (minutes < 1440) {
			var hours = Math.floor(minutes / 60);
			var minutes = minutes % 60;
			timeSinceLastBuild += '<span>' + hours + 'h ' + minutes + 'min</span> ago';
		} else {
			var days = Math.floor(minutes / 1440);
			if (days > 1) {
				var dayText = 'days';
			} else {
				var dayText = 'day';
			}
			var hours = Math.floor((minutes - (days * 60 * 24)) / 60);
			if (hours > 0) {
				var hourText = ' ' + hours + 'h';
			} else {
				var hourText = '';
			}
			timeSinceLastBuild += '<span>' + days + ' ' + dayText + hourText +'</span> ago';
		}

		return timeSinceLastBuild;
	},

	formatMinutesToShortString: function (minutes) {
		var timeSinceLastBuild = '';
		if (minutes < 1) {
			timeSinceLastBuild += '<span>now</span>';
		} else if (minutes <= 60) {
			timeSinceLastBuild += '<span>' + minutes + '\'</span>';
		} else if (minutes <= 1440) {
			var hours = Math.floor(minutes / 60);
			timeSinceLastBuild += '<span>' + hours + 'h</span>';
		} else {
			var days = Math.floor(minutes / 1440);
			if (days > 1) {
				var dayText = 'days';
			} else {
				var dayText = 'day';
			}
			timeSinceLastBuild += '<span>' + days + ' ' + dayText + '</span>';
		}

		return timeSinceLastBuild;
	},

	outputLatestBuildTime: function (jobs) {
		orderedJobs = this.getJobsOrderedByLastBuild(jobs);
		var lastBuildTimestamp = Math.round(orderedJobs[0].lastBuild.timestamp / 1000);
		var nowTimestamp = Math.round(new Date().getTime() / 1000) ;
		var minutesSinceLastBuild = Math.round((nowTimestamp - lastBuildTimestamp) / 60);

		// make it look nice (mins if <1h and hours/mins if more than one hour ago)
		var timeSinceLastBuild = '<h3>latest Build</h3>' + this.formatMinutesToString(minutesSinceLastBuild);

		$('#lastBuildTime').html(timeSinceLastBuild);
	},

	outputBestRatedJobs: function (jobs) {
		orderedJobs = this.getJobsOrderedByHealthRating(jobs);
		var fragment = '';
		for (i = 0; i < config.number_of_best_rated_jobs; i++) {
			job = orderedJobs[i];

			// hide jobs that failed last build
			if (job.color == 'red' || job.color == 'aborted') {
				continue;
			}

			fragment += '<article class="' + job.color + ' health' + this.health + '"><head>' + job.name + '</head></article>';
		}
		$('#highestRated section').html(fragment);
	},

	outputLowestRatedJobs: function (jobs) {
		orderedJobs = this.getJobsOrderedByHealthRating(jobs);
		var fragment = '';
		for (i = 0; i < config.number_of_lowest_rated_jobs; i++) {
			job = orderedJobs[orderedJobs.length-i-1];

			// hide jobs that failed last build
			if (job.color == 'red' || job.color == 'aborted') {
				continue;
			}

			fragment += '<article class="' + job.color + ' health' + this.health + '"><head>' + job.name + '</head></article>';
		}
		$('#lowestRated section').html(fragment);
	},

	updateBuildStatus : function (data) {
		jenkinsDashboard.composeHtmlFragement(jenkinsDashboard.filterJobs(data.jobs));
		jenkinsDashboard.outputLatestBuildTime(jenkinsDashboard.filterJobs(data.jobs));
		jenkinsDashboard.outputBestRatedJobs(jenkinsDashboard.filterJobs(data.jobs));
		jenkinsDashboard.outputLowestRatedJobs(jenkinsDashboard.filterJobs(data.jobs));
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