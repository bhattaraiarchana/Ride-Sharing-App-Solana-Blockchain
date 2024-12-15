#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("4RSAcdMMbPMBENvmhL8FnTvy8GkaxRncRFqepCXBBcDr");

#[program]
pub mod ride_sharing {
    use super::*;

    

    // Initialize a new ride
    pub fn create_ride(ctx: Context<CreateRide>, fare: u64) -> Result<()> {
        let ride = &mut ctx.accounts.ride;
        ride.rider = *ctx.accounts.rider.key;
        ride.fare = fare;
        ride.status = RideStatus::Requested;
        msg!("🚀 New ride created! Rider: {:?}", ride.rider);
        msg!("💸 Fare for the ride is: {}", ride.fare);
        Ok(())
    }

    // Accept a ride request
    pub fn accept_ride(ctx: Context<AcceptRide>) -> Result<()> {
        let ride = &mut ctx.accounts.ride;
        ride.driver = *ctx.accounts.driver.key;
        ride.status = RideStatus::Accepted;
        msg!("🚗 Ride accepted by driver: {:?}", ride.driver);
        Ok(())
    }

    // Complete the ride
    pub fn complete_ride(ctx: Context<CompleteRide>) -> Result<()> {
        let ride = &mut ctx.accounts.ride;
        ride.status = RideStatus::Completed;
        msg!("✅ Ride completed successfully!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateRide<'info> {
    #[account(init, payer = rider, space = 8 + 32 + 8 + 1 + 1)]
    pub ride: Account<'info, Ride>,
    #[account(mut)]
    pub rider: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptRide<'info> {
    #[account(mut)]
    pub ride: Account<'info, Ride>,
    #[account(mut)]
    pub driver: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteRide<'info> {
    #[account(mut)]
    pub ride: Account<'info, Ride>,
}

#[account]
pub struct Ride {
    pub rider: Pubkey,
    pub driver: Pubkey,
    pub fare: u64,
    pub status: RideStatus,
}

#[derive(Clone, Copy, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum RideStatus {
    Requested,
    Accepted,
    Completed,
}
