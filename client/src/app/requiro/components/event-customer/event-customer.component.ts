import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { ActionService } from 'app/requiro/services/action.service';
import { Subscription } from 'rxjs';
import 'rxjs/add/observable/timer';
import { Observable } from 'rxjs/Observable';
import { Action } from '../../../../../../datatypes/Action';
import { BranchOffice } from '../../../../../../datatypes/BranchOffice';
import { Campaign } from '../../../../../../datatypes/Campaign';
import { ClientEvent, ICustomerEvent } from '../../../../../../datatypes/clientEvent';
import { Customer } from '../../../../../../datatypes/Customer';
import { EventType, Redirect } from '../../../../../../datatypes/eventType';
import { ResultCode } from '../../../../../../datatypes/result';
import { Engagement } from '../../../../../../datatypes/viewDataType/engagement';
import { FormControl, Validators } from '../../../../../node_modules/@angular/forms';
import { CustomerModel } from '../../models/customerModel';
import { BranchOfficeService } from '../../services/branch-office.service';
import { CampaignService } from '../../services/campaign.service';
import { CustomersService } from '../../services/customers.service';
import { EngagementService } from '../../services/engagement.service';
import { EventTypeService } from '../../services/event-type.service';
import { EventsService } from '../../services/events.service';
import { MainCallDataServiceService } from '../../services/main-call-data-service.service';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'event-customer',
  templateUrl: './event-customer.component.html',
  styleUrls: ['./event-customer.component.scss']
})
export class EventCustomerComponent implements OnInit, OnChanges {

  @Input() timerActive: boolean;
  @Input() idsPayment: number[];
  indexPhone: number = 0;
  currentCustomer: Customer;
  currentPhone: string;

  @Output() redirectingCall: EventEmitter<boolean> = new EventEmitter<boolean>();

  engagementColor: string = 'primary';
  eventsColor: string = 'primary';

  private subscription: Subscription;
  private subscriptionProgressive: Subscription;
  private timer: Observable<any>;
  private eventTypeMap: Map<number, EventType>;
  newEngagement: Engagement;
  resultCtrl: FormControl;
  actionCtrl: FormControl;
  messageCtrl: FormControl;
  customer: Customer;
  eventTypes: EventType[];
  actions: Action[];
  champaign: Campaign[];
  branchOffices: BranchOffice[];
  eventAnnotationClass: string;
  totalTime: number = 100;
  progressiveTimer: number = 0;
  firstChangeCampaignOrResult = true;
  writing: boolean = false;
  historyEngagament: boolean = false;
  customerEngagamentes: any[];
  showEngagamentHistory: boolean = false;
  showEventsHistory: boolean = false;
  resultInteraction: number = null;
  actionInteraction: number = null;
  idPayment: string = null;
  newMessage: string = '';

  _customerId: number = 0;
  customerModel: CustomerModel;

  constructor(
    private eventTypeService: EventTypeService,
    private actionService: ActionService,
    private customerService: CustomersService,
    private campaignService: CampaignService,
    private tokenService: TokenService,
    private mainCallData: MainCallDataServiceService,
    private engagementService: EngagementService,
    private branchOfficeService: BranchOfficeService,
    eventsService: EventsService
  ) {
    this.customerModel = new CustomerModel(customerService, eventsService);
  }

  @Input('index-current-phone')
  set indexCurrentPhone(index: number) {
    if (index) {
      this.indexPhone = index - 1;
      console.log('index-current-phone', this.indexPhone);
      this.customerModel.setCurrentCustomer(this._customerId, (res) => {
        this.currentCustomer = this.customerModel.customer;
      });
    }
  }



  @Input('customer-id')
  set customerId(customerId: number) {
    if (customerId && customerId != 0 && customerId != this._customerId) {
      this._customerId = customerId;
      this.customerModel.setCurrentCustomer(this._customerId, (res) => {
        this.currentCustomer = this.customerModel.customer;
      });
    }
  }

  startWriting(): void {
    this.writing = true;
  }

  changeEventType(): void {
    if (this.resultInteraction && this.timerActive) {
      this.initTimer();
    }
  }

  ngOnInit() {
    this.resultCtrl = new FormControl('', { validators: Validators.required });
    this.messageCtrl = new FormControl('', { validators: Validators.required });
    this.actionCtrl = new FormControl('', { validators: Validators.required });

    this.eventTypeMap = new Map<number, EventType>();
    this.timer = Observable.timer(0, 1000);

    this.newEngagement = new Engagement();
    this.newEngagement.numberOfFees = 1;
    this.campaignService.getAll().subscribe(
      res => {
        if (res.result == ResultCode.OK) {
          this.champaign = res.data;
        } else {
          console.error(res);
        }
      },
      err => {
        console.error(err);
      }
    );
    this.eventAnnotationClass = "eventAnnotationGreen";

    this.eventTypeService.getAll().subscribe(
      response => {
        if (response.result == ResultCode.OK) {
          if (response.result > 0) {
            this.eventTypes = response.data;
            for (let i = 0; i < this.eventTypes.length; i++) {
              this.eventTypeMap.set(this.eventTypes[i].id, this.eventTypes[i]);
            }
          }
        } else {
          console.error(response);
        }
      },
      err => {
        console.error(err);
      }
    );

    this.actionService.getAll().subscribe(
      response => {
        if (response.result == ResultCode.OK) {
          if (response.result > 0) {
            this.actions = response.data;
          }
        } else {
          console.error(response);
        }
      },
      err => {
        console.error(err);
      }
    );

    this.branchOfficeService.getAll().subscribe(
      response => {
        if (response.result == ResultCode.OK) {
          this.branchOffices = response.data;
        } else {
          console.error(response);
        }
      },
      err => {
        console.error(err);
      }
    );

    this.mainCallData.currentCustomer.subscribe(
      customer => {
        if (customer !== undefined && customer !== null) {
          if (this.currentCustomer && !this.currentCustomer.eventData) {
            this.currentCustomer.eventData = { idCampaign: 0, event: null };
          }
          //this.currentCustomer.idCampaign = customer.idCampaign;
          this.historyEngagament = false;
          this.engagementService.getEngagementsByCustomer(customer.id).subscribe(
            responseEngagament => {
              console.log(responseEngagament);
              if (responseEngagament.result > 0 && responseEngagament.data && responseEngagament.data.length > 0) {
                this.customerEngagamentes = responseEngagament.data;
                this.historyEngagament = true;
                this.newEngagement.paymentPromiseDate = responseEngagament.data[0].paymentPromiseDate;
                this.newEngagement.amountFees = responseEngagament.data[0].amountFees;
                this.newEngagement.numberOfFees = responseEngagament.data[0].numberOfFees;
                this.newEngagement.amountFees = responseEngagament.data[0].amountFees;
                this.newEngagement.initialDelivery = responseEngagament.data[0].initialDelivery;
                this.newEngagement.agreedDebt = responseEngagament.data[0].agreedDebt;
                this.newEngagement.idBranchOffice = responseEngagament.data[0].idBranchOffice;
              }
            },
            err => {
              console.error(err);
            }
          );
        }
      },
      err => {
        console.error(err);
      });
  }

  checkValidForm(): boolean {
    if (this.showMessage()) {
      let result: boolean = (this.resultCtrl && this.resultCtrl.status !== 'INVALID'
        && this.messageCtrl && this.messageCtrl.status !== 'INVALID');
      return result;
    } else {
      let result: boolean = (this.resultCtrl && this.resultCtrl.status !== 'INVALID');
      return result;
    }
  }

  toogleHistory(): void {
    this.showEngagamentHistory = !this.showEngagamentHistory;
    this.showEventsHistory = false;
    this.engagementColor = this.showEngagamentHistory ? "accent" : "primary";
    this.eventsColor = this.showEventsHistory ? "accent" : "primary";
  }

  toogleEventsHistory(): void {
    this.showEventsHistory = !this.showEventsHistory;
    this.showEngagamentHistory = false;
    this.engagementColor = this.showEngagamentHistory ? "accent" : "primary";
    this.eventsColor = this.showEventsHistory ? "accent" : "primary";
  }

  saveAnnotation(): void {
    if (this.checkValidForm()) {
      this.firstChangeCampaignOrResult = true;
      if (this.subscriptionProgressive) {
        this.subscriptionProgressive.unsubscribe();
      }
      let auxEvent: ICustomerEvent;
      auxEvent = {
        id: 0,
        idUser: 0,
        idCustomer: this.currentCustomer.id,
        idAction: this.actionInteraction,
        idPayment: this.idPayment,
        date: new Date(),
        dateReminder: this.newEngagement.callAgain,
        phone: this.currentCustomer.phones[this.indexPhone],
        ext: this.tokenService.getAgentToken(),
        annotation: this.newMessage,
        eventType: this.resultInteraction
      };

      const event: EventType = this.eventTypeMap.get(this.resultInteraction);

      const currentEvent = {
        eventRedirection: event.redirect,
        idCampaign: this.currentCustomer.idCampaign,
        event: new ClientEvent(auxEvent)
      };



      this.customerService.addCustomerEvent(currentEvent).subscribe(
        response => {
          console.log(response);
          if (response.result == ResultCode.OK) {
            // 
            // OJO !!!
            // numero magico hardcodeado
            // que es??
            // 
            if (this.currentCustomer && this.currentCustomer.idCampaign === 3) {
              this.newEngagement.idEvent = response.data.id;
              this.newEngagement.annotation = this.newMessage;
              this.newEngagement.phoneNumber = this.currentCustomer.currentPhone;
              this.newEngagement.idCustomer = this.currentCustomer.id;
              this.engagementService.add(this.newEngagement).subscribe(
                _ => {
                  this.mainCallData.sendNewCustomerEvent(true, Redirect.OtherCustomer);
                  this.newEngagement = new Engagement();
                  this.newMessage = null;
                  this.resultInteraction = null;
                },
                err => {
                  console.error(err);
                });
            } else {
              // let event = this.eventTypeMap.get(this.resultInteraction);
              if (event && event.redirect == Redirect.OtherCustomer) {
                this.newMessage = null;
                this.resultInteraction = null;
                this.mainCallData.sendNewCustomerEvent(true, Redirect.OtherCustomer);
              } else if (event && event.redirect == Redirect.OtherPhone) {
                this.newMessage = null;
                this.resultInteraction = null;
                this.mainCallData.sendNewCustomerEvent(true, Redirect.OtherPhone);
              }
            }
          } else {
            alert(response.message);
            console.error(response);
          }
        },
        err => {
          console.error(err);
        }
      );
    } else {
      alert("Para guardar debe rellenar todos los campos obligatorios");
    }
  }

  eventChange(): void {
    if (this.currentCustomer && this.currentCustomer.eventData &&
      this.currentCustomer.eventData.idCampaign == 3) {
      this.initTimer();
    }
  }

  stopTimer(): void {
    this.subscription.unsubscribe();
    this.subscriptionProgressive.unsubscribe();
  }

  showMessage(): boolean {
    if (this.eventTypes) {
      let e = this.eventTypes.filter(et => et.id === this.resultInteraction)[0];
      if (e) {
        return (this.eventTypes && e.showMessage);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  initTimer(): void {
    if (this.timerActive) {
      /*
      if (this.firstChangeCampaignOrResult) {
        this.firstChangeCampaignOrResult = false;

        this.subscriptionProgressive = this.timer.subscribe(
          t => {
            this.progressiveTimer++;
            console.log(this.progressiveTimer);
          }
        );
        this.subscription = this.timer.subscribe(t => {
          if (this.totalTime > 0)
            this.totalTime--;

          if (this.totalTime >= 7) {
            this.eventAnnotationClass = "eventAnnotationGreen";
          } else if (this.totalTime < 7 && this.totalTime > 3) {
            this.eventAnnotationClass = "eventAnnotationYellow";
          } else if (this.totalTime < 4) {
            this.eventAnnotationClass = "eventAnnotationRed";
          } else if (this.totalTime == 0) {
            this.subscription.unsubscribe();
          }
        });
      }
      */
      /*
      let eventsTypes: Map<number, EventType> = new Map<number, EventType>();
      for (let i = 0; i < this.eventTypes.length; i++) {
        eventsTypes.set(this.eventTypes[i].id, this.eventTypes[i]);
      }

      if (this.currentCustomer && this.currentCustomer.eventData && 
        this.currentCustomer.eventData.event && this.currentCustomer.eventData.event.eventType) {
        this.totalTime = eventsTypes.get(this.currentCustomer.eventData.event.eventType).time - this.progressiveTimer;
        if (this.totalTime < 0) {
          this.totalTime = 0
        }
      } else if (this.currentCustomer.eventData.idCampaign === 3) {
        this.totalTime = 90;
      }
      */
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const newMessage: SimpleChange = changes.newMessage;
    if (newMessage) {
      this.newMessage = newMessage.currentValue;
    }

    const resultInteraction: SimpleChange = changes.newMessage;
    if (resultInteraction) {
      this.resultInteraction = resultInteraction.currentValue;
    }

    const name: SimpleChange = changes.indexCurrentPhone;
    if (name) {
      console.log('prev value index phone event: ', name.previousValue);
      console.log('current value index phone event: ', name.currentValue);
    }
    //this.indexPhone = index - 1;
    //TODO arreglar, peligro la parte de los indices restando numeros
    if (name && name.currentValue > 0) {
      this.indexPhone = name.currentValue - 1;
    } else {
      if (name && name.currentValue == 0) {
        this.indexPhone = name.currentValue;
      }
    }


    //this.indexPhone = name.currentValue -1;
    /*
    if (this.breakRunning && !this.timer && !this.subscription) {
      this.init();
    }
    */
  }

}