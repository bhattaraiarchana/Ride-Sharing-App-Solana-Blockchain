use anchor_lang::prelude::*;

// Your actual Solana program ID
declare_id!("8S32UanLjYVkx9sXzcJtUrk1vaVtNdhMx9rMxkguxKqU");

#[program]
pub mod ride_sharing_program {
    use super::*;

    // Register a new user
    pub fn register_user(ctx: Context<RegisterUser>, user_type: UserType) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.authority = *ctx.accounts.authority.key;
        user.user_type = user_type;
        user.rating = 0;
        user.completed_rides = 0;
        Ok(())
    }

    // Create a new ride
    pub fn create_ride(ctx: Context<CreateRide>, fare: u64, start_location: String) -> Result<()> {
        let ride = &mut ctx.accounts.ride;
        ride.rider = *ctx.accounts.rider.key;
        ride.driver = Pubkey::default(); // Default to no driver initially
        ride.fare = fare;
        ride.start_location = start_location;
        ride.status = RideStatus::Requested;
        ride.payment_confirmed = false;
        Ok(())
    }

    // Accept a ride by assigning a driver
    pub fn accept_ride(ctx: Context<AcceptRide>) -> Result<()> {
        let ride = &mut ctx.accounts.ride;
        require!(ride.status == RideStatus::Requested, RideSharingError::InvalidRideStatus);
        ride.driver = *ctx.accounts.driver.key;
        ride.status = RideStatus::Accepted;
        Ok(())
    }

    // Complete the ride
    pub fn complete_ride(ctx: Context<CompleteRide>, rating: u8) -> Result<()> {
        let ride = &mut ctx.accounts.ride;
        require!(ride.status == RideStatus::Accepted, RideSharingError::InvalidRideStatus);
        ride.status = RideStatus::Completed;

        // Record the review from the rider
        let driver = &mut ctx.accounts.driver_user;
        driver.rating = (driver.rating * driver.completed_rides as u64 + rating as u64)
            / (driver.completed_rides + 1);
        driver.completed_rides += 1;

        let rider = &mut ctx.accounts.rider_user;
        rider.completed_rides += 1;

        // Payments will be handled off-chain but confirmed here
        ride.payment_confirmed = true;

        Ok(())
    }

    // Add a review for a completed ride
    pub fn add_review(ctx: Context<AddReview>, rating: u8) -> Result<()> {
        let ride = &ctx.accounts.ride;
        require!(ride.status == RideStatus::Completed, RideSharingError::RideNotCompleted);

        // Record the review (in this case, we're assuming one review per ride)
        let driver = &mut ctx.accounts.driver_user;
        driver.rating = (driver.rating * driver.completed_rides as u64 + rating as u64)
            / (driver.completed_rides + 1);
        driver.completed_rides += 1;

        Ok(())
    }
}

// Account structs for user, ride, and review
#[account]
pub struct User {
    pub authority: Pubkey,
    pub user_type: UserType, // Rider or Driver
    pub rating: u64,
    pub completed_rides: u64,
}

#[account]
pub struct Ride {
    pub rider: Pubkey,
    pub driver: Pubkey,
    pub fare: u64,
    pub start_location: String,
    pub status: RideStatus,
    pub payment_confirmed: bool,
}

// Ride statuses
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum RideStatus {
    Requested,
    Accepted,
    Completed,
}

// User type enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum UserType {
    Rider,
    Driver,
}

// Error codes for various contract states
#[error_code]
pub enum RideSharingError {
    #[msg("The ride is not in a valid state for this operation.")]
    InvalidRideStatus,
    #[msg("Ride has not been completed yet.")]
    RideNotCompleted,
}

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(init, payer = authority, space = 8 + 72)] // Allocate space for the User account
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateRide<'info> {
    #[account(init, payer = rider, space = 8 + 128)] // Space for the Ride account
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
    #[account(mut)]
    pub driver_user: Account<'info, User>, // Driver user account to update ratings
    #[account(mut)]
    pub rider_user: Account<'info, User>, // Rider user account to update ride count
    #[account(mut)]
    pub driver: Signer<'info>,
    #[account(mut)]
    pub rider: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddReview<'info> {
    #[account(mut)]
    pub ride: Account<'info, Ride>,
    #[account(mut)]
    pub driver_user: Account<'info, User>,
    #[account(mut)]
    pub rider: Signer<'info>,
}
