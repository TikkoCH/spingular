import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { JhiEventManager, JhiParseLinks, JhiAlertService } from 'ng-jhipster';

import { IFollow } from 'app/shared/model/follow.model';
import { FollowService } from './follow.service';
import { IAppuser } from 'app/shared/model/appuser.model';
import { AppuserService } from 'app/entities/appuser/appuser.service';

import { AccountService } from 'app/core/auth/account.service';
import { ITEMS_PER_PAGE } from 'app/shared/constants/pagination.constants';

@Component({
  selector: 'jhi-follow',
  templateUrl: './follower.component.html'
})
export class FollowerComponent implements OnInit, OnDestroy {
  currentAccount: any;
  follows: IFollow[];
  error: any;
  success: any;
  eventSubscriber: Subscription;
  routeData: any;
  links: any;
  totalItems: any;
  itemsPerPage: any;
  page: any;
  predicate: any;
  previousPage: any;
  reverse: any;

  nameParamFollows: any;
  valueParamFollows: any;
  zipZeroResults: any;
  followingId: number;

  userQuery: boolean;
  communityQuery: boolean;
  appusers: IAppuser[];
  appuser: IAppuser;
  owner: any;
  isAdmin: boolean;

  constructor(
    protected followService: FollowService,
    protected parseLinks: JhiParseLinks,
    protected jhiAlertService: JhiAlertService,
    protected accountService: AccountService,
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    protected eventManager: JhiEventManager,
    protected appuserService: AppuserService
  ) {
    this.itemsPerPage = ITEMS_PER_PAGE;
    this.routeData = this.activatedRoute.data.subscribe(data => {
      this.page = data.pagingParams.page;
      this.previousPage = data.pagingParams.page;
      this.reverse = data.pagingParams.ascending;
      this.predicate = data.pagingParams.predicate;
    });
    this.activatedRoute.queryParams.subscribe(params => {
      if (params.followingIdEquals != null) {
        this.nameParamFollows = 'followingId.equals';
        this.valueParamFollows = params.followingIdEquals;
        this.userQuery = true;
      }
      if (params.cfollowingIdEquals != null) {
        this.nameParamFollows = 'cfollowingId.equals';
        this.valueParamFollows = params.cfollowingIdEquals;
        this.communityQuery = true;
      }
    });
  }

  loadAll() {
    if (this.communityQuery === true) {
      const query = {};
      query['cfollowingId.equals'] = this.valueParamFollows;
      this.followService
        .query(query)
        .subscribe(
          (res: HttpResponse<IFollow[]>) => this.paginateFollows(res.body, res.headers),
          (res: HttpErrorResponse) => this.onError(res.message)
        );
    }
    if (this.userQuery === true) {
      const query = {};
      query['followingId.equals'] = this.valueParamFollows;
      this.followService
        .query(query)
        .subscribe(
          (res: HttpResponse<IFollow[]>) => this.paginateFollows(res.body, res.headers),
          (res: HttpErrorResponse) => this.onError(res.message)
        );
    }
  }

  loadPage(page: number) {
    if (page !== this.previousPage) {
      this.previousPage = page;
      this.transition();
    }
  }

  transition() {
    this.router.navigate(['/follow'], {
      queryParams: {
        page: this.page,
        size: this.itemsPerPage,
        sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
      }
    });
    this.loadAll();
  }

  clear() {
    this.page = 0;
    this.router.navigate([
      '/follow',
      {
        page: this.page,
        sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
      }
    ]);
    this.loadAll();
  }

  ngOnInit() {
    this.loadAll();
    if (this.userQuery === true) {
      this.accountService.identity().subscribe(
        account => {
          this.currentAccount = account;
          this.isAdmin = this.accountService.hasAnyAuthority(['ROLE_ADMIN']);
          const query = {};
          if (this.currentAccount.id != null) {
            query['userId.equals'] = this.currentAccount.id;
          }
          this.appuserService.query(query).subscribe((res: HttpResponse<IAppuser[]>) => {
            this.owner = res.body[0].id;
          });
        },
        (res: HttpErrorResponse) => this.onError(res.message)
      );
    }
    this.registerChangeInFollows();
  }

  ngOnDestroy() {
    this.eventManager.destroy(this.eventSubscriber);
  }

  trackId(index: number, item: IFollow) {
    return item.id;
  }

  registerChangeInFollows() {
    this.eventSubscriber = this.eventManager.subscribe('followListModification', response => this.loadAll());
  }

  sort() {
    const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
    if (this.predicate !== 'id') {
      result.push('id');
    }
    return result;
  }

  private paginateFollows(data: IFollow[], headers: HttpHeaders) {
    this.links = this.parseLinks.parse(headers.get('link'));
    this.totalItems = parseInt(headers.get('X-Total-Count'), 10);
    this.follows = data;
  }

  private onError(errorMessage: string) {
    this.jhiAlertService.error(errorMessage, null, null);
  }
}
