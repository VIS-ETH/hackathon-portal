use minilp::{ComparisonOp, OptimizationDirection, Problem, Solution, Variable};
use uuid::Uuid;

use std::collections::HashMap;

type TeamId = Uuid;
type ProjectId = Uuid;
type Preference = HashMap<TeamId, ProjectPref>;
type ProjectPref = HashMap<ProjectId, i32>;

#[derive(Clone, Copy)]
pub struct AssignmentVariable {
    team: Uuid,
    project: Uuid,
    variable: Variable,
}

pub struct GroupAssignment {
    teams: Vec<Uuid>,
    project: Vec<Uuid>,
    mps: i32,
    problem: Problem,
    variables: Vec<AssignmentVariable>,
    preferences: Preference,
}

impl GroupAssignment {
    pub fn new(
        teams: Vec<Uuid>,
        project: Vec<Uuid>,
        max_project_size: i32,
        preferences: Preference,
    ) -> Option<Self> {
        if teams.len()
            > (project.len() as i32 * max_project_size)
                .try_into()
                .unwrap()
        {
            return None;
        }
        let problem = Problem::new(OptimizationDirection::Minimize);
        let variables = Vec::<AssignmentVariable>::new();
        let mut res = Self {
            teams,
            project,
            mps: max_project_size,
            problem,
            variables,
            preferences,
        };
        res.create_variables();
        res.create_project_constraints();
        res.create_team_constraint();
        Some(res)
    }

    fn create_variables(&mut self) {
        for t in &self.teams {
            for p in &self.project {
                let score = self.preferences.get(&t);
                let coeff = match score {
                    None => self.project.len() as i32,
                    Some(perf) => *perf.get(&p).unwrap_or(&(self.project.len() as i32)),
                };

                let variable = self.problem.add_var(coeff as f64, (0.0, 1.0));
                self.variables.push(AssignmentVariable {
                    team: t.clone(),
                    project: p.clone(),
                    variable,
                });
            }
        }
    }
    fn create_project_constraints(&mut self) {
        for p in &self.project {
            let vars = self
                .variables
                .clone()
                .into_iter()
                .filter_map(|var| {
                    if var.project == p.clone() {
                        Some((var.variable, 1.0))
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>();
            self.problem
                .add_constraint(&vars, ComparisonOp::Le, self.mps as f64);
            self.problem.add_constraint(&vars, ComparisonOp::Ge, 0.0);
        }
    }

    fn create_team_constraint(&mut self) {
        for t in &self.teams {
            let vars = self
                .variables
                .clone()
                .into_iter()
                .filter_map(|var| {
                    if var.team == t.clone() {
                        Some((var.variable, 1.0))
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>();
            self.problem.add_constraint(&vars, ComparisonOp::Le, 1.0);
            self.problem.add_constraint(&vars, ComparisonOp::Ge, 1.0);
        }
    }

    fn get_mapping(&mut self, sol: Solution) -> HashMap<Uuid, Uuid> {
        let mut solution = HashMap::<Uuid, Uuid>::new();
        for var in &self.variables {
            let res = *sol.var_value(var.variable);
            if res > 0.5 {
                solution.insert(var.team, var.project);
            }
        }
        solution
    }

    pub fn solve(&mut self) -> Result<HashMap<Uuid, Uuid>, minilp::Error> {
        let res = self.problem.solve();
        let sol = match res {
            Err(err) => return Err(err),
            Ok(sol) => {
                // println!("unhappines points: {}", sol.objective() - self.teams as f64);
                sol
            }
        };
        Ok(self.get_mapping(sol))
    }
}
