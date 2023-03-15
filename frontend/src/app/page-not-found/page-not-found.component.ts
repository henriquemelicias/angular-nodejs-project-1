import { Component, OnInit } from '@angular/core';
import {PlatformLocation} from '@angular/common';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css']
})
export class PageNotFoundComponent implements OnInit {

  constructor(private route: ActivatedRoute, private location: PlatformLocation) {

    // if user was redirected from an non existant page,go back button, when pressed, is done two times
    this.route.queryParams
      .subscribe(params => {

        // if user was redirected to this page, change go back route to home
        if ( params.redirected === "true" )
        {
          location.replaceState({}, "", "/home");
          location.pushState({}, "", "/404");
        }
      });
  }

  ngOnInit(): void {
  }
}
